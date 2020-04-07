import sys
sys.path.append("../Domains")
from cartpole import CartPole

import numpy as np
import datetime, time

from multiprocessing import Queue
from copy import deepcopy
from collections import namedtuple

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Categorical

class Policy(nn.Module):
    def __init__(self):
        super(Policy, self).__init__()
        # actor's layer
        self.action_head = nn.Linear(4, 2)
        self.saved_actions = []

    def forward(self, x):
        # actor: choses action to take from state s_t
        # by returning probability of each action
        action_prob = F.softmax(self.action_head(x), dim=-1)

        # return values for both actor and critic as a tuple of 2 values:
        # 1. a list with the probability of each action over the action space
        # 2. the value from state s_t
        return action_prob


model = Policy() # init policy
optimizer = optim.SGD(model.parameters(), lr=5e-3)


def select_action(state):
    state = torch.from_numpy(state).float()
    action_probs = model(state)

    action = np.argmax(action_probs.detach().numpy())

    # TODO not sure I need to make this categorical
    m = Categorical(action_probs)
    print (m.log_prob(torch.tensor(action)))
    model.saved_actions.append(m.log_prob(torch.tensor(action)))

    # the action to take (left or right)
    return (action, action_probs)

def COACH(domain,
               trace_set = [0.95],
               delay = 6,
               learning_rate = 2.5e-4):

    prob_histories = []
    state = domain.get_current_features()
    eligibility_traces = {}
    for trace_value in trace_set:
        eligibility_traces[trace_value] = torch.zeros(2, requires_grad=False)
        print (eligibility_traces[trace_value])
    first_episode = True

    while True:
        action, action_probs = select_action(state)
        reward, done = domain.take_action(action)
        new_state = domain.get_current_features()
        prob_histories.append((state, action, reward, action_probs))

        advantage = reward
        loss = -1 * model.saved_actions[-1] * advantage
        model.zero_grad()
        loss.backward()

        print ("success")
        print (  1 / prob_histories[-1][3] )

        for trace_gamma in trace_set:
            for p in model.parameters():
                eligibility_traces[trace_gamma] = trace_gamma * eligibility_traces[trace_gamma] + 1 / prob_histories[-1][3]

        print ('made it here')
        exit()

        for p in model.parameters():
            print (p.grad)
        with torch.no_grad():

            for p in model.parameters():
                new_val = p.grad * 0.1
                p.copy_(new_val)
                print (p.grad)

        print ("success 2")

        # print(eligibility_traces)




        state = new_state
if __name__ == "__main__":
    domain = CartPole()

    COACH(domain)
