import sys, random, torch
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

class COACH:
    weights = None
    eligibility_traces = {}
    trace_set = None
    learning_rate = None

    def __init__(obs_size, action_size, trace_set = [0.99], delay = 0, learning_rate = 0.05):
        self.weights = np.zeros((obs_size, action_size))
        self.trace_set = trace_set
        self.learning_rate = learning_rate

        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

    def get_proposed_action(state):
        # Determine which action to take
        action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(self.weights)))
        action = np.random.choice(n_action, p=action_weights)

        # compute gradient
        dsoftmax = softmax_grad(action_weights)[action]
        dlog = dsoftmax / action_weights[action].numpy()
        gradient = state[None,:].T.dot(dlog[None,:])

        return action_weights, action, gradient

    def train_COACH(last_state, last_action, last_gradient, reward, selected_trace = 0.99):
        # TODO - select trace automatically
        for trace_val in self.trace_set:
            self.eligibility_traces[trace_val] = trace_val * self.eligibility_traces[trace_val]
            self.eligibility_traces[trace_val] += last_gradient

        weights_delta = self.learning_rate * human_reward * eligibility_traces[selected_trace]
        self.weights += weights_delta

    def reset():
        for trace_val in trace_set:
            self.eligibility_traces[trace_val] = np.zeros(self.weights.shape)

class SimpleEcho(WebSocket):

    def handleMessage(self):
        # echo message back to client
        print (self.data)
        self.sendMessage(self.data)

    def handleConnected(self):
        print(self.address, 'connected')

    def handleClose(self):
        print(self.address, 'closed')

if __name__ == "__main__":
    HOST, PORT = "localhost", 8080

    server = SimpleWebSocketServer('', 8000, SimpleEcho)
    server.serveforever()
