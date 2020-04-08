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

def COACH(domain, weights, trace_set = [0], delay = 6, learning_rate = 5e-4, oracle_parameters = None):
    state = domain.reset()
    grads = []
    total_reward = 0
    done = False
    num_steps = 0

    eligibility_traces = {}
    for trace_value in trace_set:
        eligibility_traces[trace_value] = torch.zeros(domain.num_actions, requires_grad=True)

    for _ in range(0, 1000):

        human_reward = 0
        state = torch.from_numpy(state).float()
        z = torch.matmul(state, weights)
        probs = torch.nn.Softmax(dim=0)(z)
        action = np.argmax(probs.detach().numpy())
        # m = torch.distributions.Categorical(probs)
        # action = m.sample().item()

        # compute gradient
        d_softmax = torch.diag(probs) - probs.view(-1, 1) * probs
        d_log = d_softmax[action] / probs[action]
        grad = state.view(-1, 1) * d_log
        grads.append(grad)

        reward, done = domain.take_action(action)
        total_reward += reward
        state = np.array(domain.last_observation)
        if done:
            break

        if oracle_parameters != None:
            human_reward = cartpole_oracle.ask_oracle_advice(domain, oracle_parameters, action)
        else:
            human_reward = total_reward


        for trace_value in trace_set:
            eligibility_traces[trace_value] = trace_value * eligibility_traces[trace_value] + (1 / probs[action]) * grad[action]

        weights += learning_rate * human_reward * eligibility_traces[0]

    return (total_reward, grads)
    # todo

if __name__ == "__main__":
    domain = CartPole()

    # print ("training oracle")
    # oracle_parameters = cartpole_oracle.train(domain)
    # print ("oracle trained")

    n_state = domain.obs_size
    n_action = domain.num_actions
    weights = torch.zeros(n_state, n_action)

    for i in range(0, 1000):
        total_reward, grads = COACH(domain, weights)
        print ("total reward " + str(total_reward))
        # for j, grad in enumerate(grads):
        #     weights += 0.001 * grad * (total_reward - j)
