import numpy as np
import torch

def softmax_grad_2(s):
    SM = s.reshape((-1,1))
    # d_softmax = torch.diag(probs) - probs.view(-1, 1) * probs
    # d_log = d_softmax[action] / probs[action]
    # grad = d_log
    jacobian = np.diagflat(s) - np.dot(SM, SM.T)
    return jacobian

def softmax_grad_3(s):
    d_softmax = torch.diag(s) - s.view(-1, 1) * s
    d_log = d_softmax[1] / s[1]
    grad = d_log
    return grad

def softmax_grad(s):
    # Take the derivative of softmax element w.r.t the each logit which is usually Wi * X
    # input s is softmax value of the original input x.
    # s.shape = (1, n)
    # i.e. s = np.array([0.3, 0.7]), x = np.array([0, 1])
    # initialize the 2-D jacobian matrix.
    s = s.reshape(-1,1)
    return np.diagflat(s) - np.dot(s, s.T)

def softmax(z):
    z -= np.max(z)
    sm = (np.exp(z).T / np.sum(np.exp(z), axis=0)).T
    return sm

def softmax_grad_8(probs):
    n_elements = probs.shape[0]
    jacobian = probs[:, np.newaxis] * (np.eye(n_elements) - probs[np.newaxis, :])
    return jacobian

def softmax_2(z):
    probs = torch.nn.Softmax(dim=0)(torch.tensor(z).float())

    return probs

x = np.ones((40,4))

# print (softmax(x))
print (softmax_2(x))
print (softmax_grad_8(softmax(x)))
