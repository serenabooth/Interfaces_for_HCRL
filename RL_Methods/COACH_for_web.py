import sys
sys.path.append("Domains/")
from cartpole import CartPole

import sys, random, torch, threading, time, json
import numpy as np
import datetime, time
from copy import deepcopy
from operator import itemgetter

import matplotlib.pyplot as plt
from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket


def softmax_grad(s):
    """
    Compute the gradient of a softmax function.

    Params
    ------
        s : a numpy matrix
    """
    s = np.array(s)
    SM = s.reshape((-1,1))
    jacobian = np.diagflat(s) - np.dot(SM, SM.T)
    return jacobian

def update_state(state, action):
    """
    Use OpenAI Gym implementation to predict how the state will change.
    A bit hacky; we could instead communicate with JS through the websocket.

    Params
    ------
        state : list of form [x, xdot, theta, thetadot]
        action : int [0 or 1, corresponding to left or right]

    Returns
    -------
        obs : a list of form [x, xdot, theta, thetadot]
    """
    cartpole = CartPole()
    cartpole.set_state(state)
    _, done = cartpole.take_action(action)

    # if the last action takes it out of range, REPEAT
    # This could use more attention to make sure behavior is desirable...
    if done:
        print ("Warning: action took state out of bounds")
        cartpole.set_state(state)

    return cartpole.last_observation

class COACH():
    weights = None
    eligibility_traces = {}
    trace_set = None
    learning_rate = None

    last_action = None
    last_gradient = np.array([])

    n_action = None
    obs_size = None

    def __init__(self, obs_size, action_size, trace_set = [0.99], delay = 0, learning_rate = 0.05):
        self.obs_size = obs_size
        self.n_action = action_size
        self.weights = np.zeros((obs_size, action_size))
        self.trace_set = trace_set
        self.learning_rate = learning_rate

        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

    def get_proposed_action(self, state, take_action = True, num_steps = 1, deterministic = False, verbose = False):
        proposed_action_list = []
        for _ in range(0, num_steps):
            state = np.array(state)

            action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(self.weights)))
            action = np.random.choice(self.n_action, p=action_weights)

            if verbose:
                print (action_weights)
                print ('action ', str(action))
            # compute gradient
            dsoftmax = softmax_grad(action_weights)[action]
            dlog = dsoftmax / action_weights[action].numpy()
            gradient = state[None,:].T.dot(dlog[None,:])

            state = update_state(state, action)

            if take_action:
                self.last_action = action
                self.last_gradient = gradient

            # if num_steps == 1:
            #     return action
            # else:
            proposed_action_list.append(action)
        return proposed_action_list, state

    def update_weights(self, reward, selected_trace = 0.99):
        """
        """
        # TODO - select trace automatically

        if self.last_gradient.size == 0:
            print ("No gradient; cannot update weights")
            return

        for trace_val in self.trace_set:
            self.eligibility_traces[trace_val] = trace_val * self.eligibility_traces[trace_val]
            self.eligibility_traces[trace_val] += self.last_gradient

        weights_delta = self.learning_rate * reward * self.eligibility_traces[selected_trace]
        self.weights += weights_delta

    def reset(self):
        """
        Reset all weights to zero

        Params:
            self : a COACH object
        """
        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

def order_cartpoles(cartpoles):
    """
    Reorders a list of cartpoles using the state_diff property

    Params:
        cartpoles : a list pairing of form ["cartpoleId": action_sequence]

    Returns:
        a list of ordered cartpoleIds [cart1, cart2, cart0]
    """
    cartpoles_ordered = sorted(list(cartpoles.values()), key=lambda k: k['state_diff'], reverse=True)
    print (cartpoles_ordered)
    return cartpoles_ordered

clients = []
class SimpleEcho(WebSocket):
    """
    """

    def handleMessage(self):
        """
        """
        global COACH_TRAINER
        # echo message back to client
        print ("Handling message")
        msg = json.loads(self.data)
        print (msg)

        if isinstance(msg,dict):
            if "msg_type" in msg.keys() and msg["msg_type"] == "feedback":
                # Train COACH with feedback received
                COACH_TRAINER.update_weights(msg['reward'])

                # communicate that the policy has been updated
                response = {
                    "msg_type" : "policy_updated",
                }
                response = json.dumps(response)
                self.sendMessage(response)

                # Communicate which action to take next
                action, _ = COACH_TRAINER.get_proposed_action(msg['state'], take_action = True)
                response = {
                    "msg_type" : "proposed_action",
                    "action": action
                }
                response = json.dumps(response)
                self.sendMessage(response)
            elif "msg_type" in msg.keys() and msg["msg_type"] == "get_actions_cartpole_group":
                proposed_actions = {"msg_type" : "proposed_actions_cartpole_group"}


                cartpole_list = {}
                for id in msg["cartpoles"].keys():
                    starting_state = np.array(msg["cartpoles"][id]["state"])
                    num_steps = msg["cartpoles"][id]["num_steps"]
                    actions, last_state = COACH_TRAINER.get_proposed_action(starting_state,
                                                                take_action = False,
                                                                num_steps = num_steps,
                                                                deterministic = True)
                    state_diff = np.subtract(starting_state, last_state).sum()
                    cartpole_list[id] = {"cartpoleId": id,
                                         "divId": msg["cartpoles"][id]["divId"],
                                         "proposed_actions": actions,
                                         "state_diff": state_diff}


                # TODO - make this order meaningful!
                proposed_actions["ordered_cartpoles"] = order_cartpoles(cartpole_list)

                response = json.dumps(proposed_actions)
                self.sendMessage(response)

            elif "msg_type" in msg.keys() and msg["msg_type"] == "get_deterministic_action":
                cartpole_id = msg["cartpole_id"]
                action = COACH_TRAINER.get_proposed_action(msg['state'], take_action = False, deterministic = True)
                response = {
                    "msg_type": "proposed_action",
                    "cartpole_id": cartpole_id,
                    "action": action
                }
                response = json.dumps(response)
                self.sendMessage(response)

    def handleConnected(self):
        clients.append(self)
        print(self.address, 'connected')

    def handleClose(self):
        clients.remove(self)
        print(self.address, 'closed')

COACH_TRAINER = COACH(obs_size = 4, action_size = 2)



if __name__ == "__main__":
    HOST, PORT = "localhost", 8080

    server = SimpleWebSocketServer('', 8000, SimpleEcho)

    server_thread = threading.Thread(target=server.serveforever)
    server_thread.daemon = True
    server_thread.start()

    while True:
        # for client in clients:
        #     client.sendMessage("hello")
        time.sleep(0.31)
