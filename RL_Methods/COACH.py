import sys
sys.path.append("../Domains")
from cartpole import CartPole
from gridworld import Gridworld
from torchvision import transforms

import cartpole_oracle

import numpy as np
import datetime, time

from copy import deepcopy

import random
import torch

def COACH(domain, weights, trace_set = [0.95], delay = 6, learning_rate = 5e-2, oracle_parameters = None):
    state = domain.reset()
    grads = []
    total_reward = 0
    done = False
    num_steps = 0

    eligibility_traces = {}
    for trace_value in trace_set:
        eligibility_traces[trace_value] = torch.zeros(4, requires_grad=True)

    for _ in range(0, 1000):

        human_reward = 0
        state = torch.from_numpy(state).float()
        # print ("Weights: " + str(weights))
        # print (state)
        z = torch.matmul(state, weights)
        # print (z)
        probs = torch.nn.Softmax(dim=0)(z)
        print ("Probs " + str(probs))
        # if random.random() < 0.2:
        #     action = random.randint(0,3)
        # else:
        #     action = np.argmax(probs.detach().numpy())
        # print (probs)
        m = torch.distributions.Categorical(probs)
        action = m.sample()
        # print (action)

        #action = int(torch.bernoulli(max(probs[1])).item())

        d_softmax = torch.diag(probs) - probs.view(-1, 1) * probs

        d_log = d_softmax[action] / probs[action]
        grad = state.view(-1, 1) * d_log
        print ("Gradient: " + str(grad))
        grads.append(grad)

        if oracle_parameters != None and random.random() < 0.2:
            human_reward = cartpole_oracle.ask_oracle_advice(domain, oracle_parameters, action)
            print ('human reward' + str(human_reward))

        reward, done = domain.take_action(action)
        state = np.array(domain.last_observation)
        if done:
            break
        human_reward = reward

        total_reward += reward
        # for num_steps, grad in enumerate(grads):
        # if human_reward > 0:
        # for trace_value in trace_set:
        #     eligibility_traces[trace_value] = trace_value * eligibility_traces[trace_value] + 1 / probs * grad

        weights += learning_rate * human_reward * grad / probs

    return (total_reward, grads)
    # todo

if __name__ == "__main__":
    domain = Gridworld()

    # print ("training oracle")
    # oracle_parameters = cartpole_oracle.train(domain)
    # print ("oracle trained")

    n_state = domain.obs_size
    n_action = domain.num_actions
    print (n_action)
    weights = torch.zeros(n_state, n_action)
    print (weights)

    for i in range(0, 10):
        total_reward, grads = COACH(domain, weights)
        print ("total reward " + str(total_reward))
        # for j, grad in enumerate(grads):
        #     weights += 0.001 * grad * (total_reward - j)
