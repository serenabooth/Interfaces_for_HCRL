import sys
sys.path.append("../Domains")
from cartpole import CartPole
import cartpole_oracle

import numpy as np
import datetime, time

from copy import deepcopy

import random
import torch

def COACH(domain, weights, trace_set = [0.95, 0.35], delay = 6, learning_rate = 1e-3, oracle_parameters = None):
    state = domain.reset()
    grads = []
    total_reward = 0
    done = False
    num_steps = 0

    eligibility_traces = {}
    for trace_value in trace_set:
        eligibility_traces[trace_value] = torch.zeros(2, requires_grad=False)

    while not done:
        human_reward = 0
        state = torch.from_numpy(state).float()
        z = torch.matmul(state, weights)
        probs = torch.nn.Softmax(dim=0)(z)
        print (probs)
        action = np.argmax(probs.detach().numpy())
        #action = int(torch.bernoulli(max(probs[1])).item())

        d_softmax = torch.diag(probs) - probs.view(-1, 1) * probs
        d_log = d_softmax[action] / probs[action]
        grad = state.view(-1, 1) * d_log
        grads.append(grad)


        if random.random() < 0.2:
            human_reward = cartpole_oracle.ask_oracle_advice(domain, oracle_parameters, action)
            print ('human reward' + str(human_reward))


        reward, done = domain.take_action(action)
        state = domain.last_observation



        total_reward += reward
        num_steps += 1

        # for num_steps, grad in enumerate(grads):
        if human_reward > 0:
            for trace_value in trace_set:
                eligibility_traces[trace_value] = trace_value * eligibility_traces[trace_value] + 1 / probs * grad

            weights += learning_rate * human_reward * eligibility_traces[0.95]

    return (total_reward, grads)
    # todo

if __name__ == "__main__":
    domain = CartPole()

    print ("training oracle")
    oracle_parameters = cartpole_oracle.train(domain)
    print ("oracle trained")

    n_state = domain.obs_size
    n_action = domain.num_actions
    weights = torch.rand(n_state, n_action)

    for i in range(0, 1000):
        total_reward, grads = COACH(domain, weights, oracle_parameters=oracle_parameters)
        print (total_reward)
        # for j, grad in enumerate(grads):
        #     weights += 0.001 * grad * (total_reward - j)
