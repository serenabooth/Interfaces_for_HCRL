import sys
sys.path.append("../Domains")
from cartpole import CartPole

import numpy as np
import datetime, time

from multiprocessing import Queue
from copy import deepcopy
import torch



def COACH(domain, trace_values = [0.95], delay = 6, learning_rate = 0.95):
    state = domain.get_current_features()

    policy_weights = torch.zeros(len(state), requires_grad=True)

    print (policy_weights.grad)
    actions = domain.get_possible_actions()

    traces = {}
    for trace_val in trace_values:
        traces[trace_val] = torch.zeros(len(state))

    print (traces)

    while True:
        print ('executing')
        action = 0 if np.dot(policy_weights.detach(), state) < 0 else 1
        env_reward, done = domain.take_action(action)

        state = domain.get_current_features()
        human_feedback = 1

        if policy_weights.grad != None:
            traces[0.95] = 0.95 * traces[0.95] + policy_weights.grad

        print (action)
        # exit()
        policy_weights = policy_weights + learning_rate * human_feedback  



if __name__ == "__main__":
    domain = CartPole()

    COACH(domain)