import sys, random, torch, threading, time, json
import numpy as np
import datetime, time
from copy import deepcopy
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

    def get_proposed_action(self, state, take_action = True):
        state = np.array(state)

        action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(self.weights)))
        action = np.random.choice(self.n_action, p=action_weights)

        print (action_weights)

        print ('action ' + str(action))
        # compute gradient
        dsoftmax = softmax_grad(action_weights)[action]
        dlog = dsoftmax / action_weights[action].numpy()
        gradient = state[None,:].T.dot(dlog[None,:])

        if take_action:
            self.last_action = action
            self.last_gradient = gradient

        return action

    def update_weights(self, reward, selected_trace = 0.99):
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
        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

clients = []
class SimpleEcho(WebSocket):
    def handleMessage(self):
        global COACH_TRAINER
        # echo message back to client
        print ("Handling message")
        msg = json.loads(self.data)
        print (msg)

        if isinstance(msg,dict):
            if "msg_type" in msg.keys() and msg["msg_type"] == "feedback":
                # Train COACH with feedback received
                COACH_TRAINER.update_weights(msg['reward'])

                # Communicate which action to take next
                action = COACH_TRAINER.get_proposed_action(msg['state'], take_action = True)
                response = {
                    "msg_type" : "proposed_action",
                    "action": action
                }
                response = json.dumps(response)
                self.sendMessage(response)


        # self.sendMessage(self.data)

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
        time.sleep(0.1)
