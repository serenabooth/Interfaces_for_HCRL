import COACH
from cartpole import CartPole
import sys, random, torch, threading, time, json, traceback
import numpy as np
import datetime, time
from copy import deepcopy
from operator import itemgetter
from sklearn.cluster import KMeans

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

    return cartpole.last_observation, done

class COACH_FOR_WEB():
    weights = None
    eligibility_traces = {}
    trace_set = None
    learning_rate = None

    last_action = None
    last_gradient = np.array([])

    n_action = None
    obs_size = None

    def __init__(self, obs_size, action_size, trace_set = [0.99], delay = 0, learning_rate = 0.05):
        """
        """
        self.obs_size = obs_size
        self.n_action = action_size
        self.weights = np.random.rand(obs_size, action_size)
        domain = CartPole()
        self.trace_set = trace_set
        self.learning_rate = learning_rate

        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

    def get_proposed_action(self, state, take_action = True, num_steps = 1, deterministic = False, verbose = False):
        """
        """
        epsilon = 0.15
        proposed_action_list = []
        for _ in range(0, num_steps):
            state = np.array(state)

            action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(self.weights)))

            if deterministic or random.random() > epsilon:
                action = int(np.argmax(action_weights.numpy()))
            else:
                action = np.random.choice(self.n_action, p=action_weights)

            # compute gradient
            dsoftmax = softmax_grad(action_weights)[action]
            dlog = dsoftmax / action_weights[action].numpy()
            gradient = state[None,:].T.dot(dlog[None,:])

            # only edit the status for states where feedback is given.
            if take_action:
                self.last_action = action
                self.last_gradient = gradient

            state, done = update_state(state, action)

            if not done:
                proposed_action_list.append(action)

            if verbose:
                # print ("action_weights", action_weights)
                # print ('action ', str(action))
                print (type(proposed_action_list[0]))
                print (proposed_action_list)
                print (type(proposed_action_list))

        return proposed_action_list, state

    def update_weights(self, reward, selected_trace = 0.99):
        """
        Apply the COACH update procedure to update self.weights

        Params:
            self : a COACH object
            reward : int
            selected_trace : float, identifying lambda value of trace

        Returns:
            None
        """
        # TODO - select trace in a smart way
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

def order_cartpoles(cartpoles, criteria="longest"):
    """
    Reorders a list of cartpoles using the state_diff property

    Params:
        cartpoles : a list pairing of form ["cartpoleId": action_sequence]

    Returns:
        a list of ordered cartpoleIds [cart1, cart2, cart0]
    """
    cartpoles_ordered = list(cartpoles.values())
    if criteria == "longest":
        cartpoles_ordered = sorted(cartpoles_ordered, key=lambda k: len(k['proposed_actions']), reverse=True)
    if criteria == "max_state_delta":
        cartpoles_ordered = sorted(cartpoles_ordered, key=lambda k: k['state_diff'], reverse=True)
    return cartpoles_ordered

clients = []
class COACH_WebSocket(WebSocket):
    """
    """

    def handleMessage(self):
        """
        """
        global COACH_TRAINER
        # echo message back to client
        print ("Handling message")
        msg = json.loads(self.data)
        # print (msg)

        if isinstance(msg,dict):
            assert ("msg_type" in msg.keys())

            # update weights
            if msg["msg_type"] == "feedback":
                # Train COACH with feedback received
                COACH_TRAINER.update_weights(msg['reward'])

                # communicate that the policy has been updated
                response = {
                    "msg_type" : "policy_updated",
                }
                response = json.dumps(response)
                self.sendMessage(response)

            elif msg["msg_type"] == "user_test":
                cp_state = msg["cp_state"]

                # TODO: else, raise exception
                if msg["user_input"] == "left":
                    dir = 0
                elif msg["user_input"] == "right":
                    dir = 1
                actions, last_state = COACH_TRAINER.get_proposed_action(cp_state,
                                                                take_action = False,
                                                                num_steps = 1,
                                                                deterministic = True)
                score = (actions[0] == dir)
                response = {
                    "msg_type": "user_assessment",
                    "score":score
                }
                response = json.dumps(response)
                self.sendMessage(response)

            # get actions for each cartpole
            elif msg["msg_type"] == "get_actions_cartpole_group":
                proposed_actions = {"msg_type" : "proposed_actions_cartpole_group"}


                cartpole_list = {}
                for id in msg["cartpoles"].keys():
                    starting_state = np.array(msg["cartpoles"][id]["state"])
                    num_steps = msg["cartpoles"][id]["num_steps"]
                    take_action = False
                    if msg["cartpoles"][id]["divId"] == "cart_feedback":
                        take_action = True
                    actions, last_state = COACH_TRAINER.get_proposed_action(starting_state,
                                                                take_action = take_action,
                                                                num_steps = num_steps,
                                                                deterministic = True)
                    state_diff = np.subtract(starting_state, last_state).sum()

                    # special case - the cart for getting feedback
                    if msg["cartpoles"][id]["divId"] == "cart_feedback" or \
                       msg["cartpoles"][id]["divId"] == "user_test":
                        proposed_actions["cart_feedback"] = {"proposed_actions":actions,
                                                             "cartpoleId": "cart_feedback",
                                                             "divId":msg["cartpoles"][id]["divId"],
                                                             }
                    else:
                        cartpole_list[id] = {"cartpoleId": id,
                                            "divId": msg["cartpoles"][id]["divId"],
                                            "proposed_actions": actions,
                                            "state_diff": state_diff,
                                            }

                # Reorder cartpoles
                proposed_actions["ordered_cartpoles"] = order_cartpoles(cartpole_list)

                response = json.dumps(proposed_actions)
                self.sendMessage(response)

    def handleConnected(self):
        clients.append(self)
        print(self.address, 'connected')

    def handleClose(self):
        clients.remove(self)
        print(self.address, 'closed')


COACH_TRAINER = COACH_FOR_WEB(obs_size = 4, action_size = 2)
if __name__ == "__main__":
    HOST, PORT = "localhost", 8080

    server = SimpleWebSocketServer('', 8000, COACH_WebSocket)
    try:
        server_thread = threading.Thread(target=server.serveforever)
        server_thread.daemon = True
        server_thread.start()
    except:
        traceback.print_exc()

    while True:
        time.sleep(0.5)
