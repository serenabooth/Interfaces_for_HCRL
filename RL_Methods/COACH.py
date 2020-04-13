import sys
sys.path.append("../Domains")
from cartpole import CartPole
from gridworld import Gridworld

import cartpole_oracle

import numpy as np
import datetime, time

from copy import deepcopy

import random
import torch
import matplotlib.pyplot as plt

def rand_argmax(b):
  return np.argmax(np.random.random(b.shape) * (b==b.max()))


def softmax_grad(s):
    """
    Compute the gradient of a softmax function.

    Params
    ------
        s : a numpy matrix
    """
    SM = s.reshape((-1,1))
    jacobian = np.diagflat(s) - np.dot(SM, SM.T)
    return jacobian

def COACH(domain, theta, learning_rate = 0.05, oracle_parameters = None, reward_fn = 0):
    state = domain.reset()[:]
    total_reward = 0
    done = False
    num_steps = 0

    # limit the number of episode steps to 1000
    for _ in range(0, 1000):
        num_steps += 1
        human_reward = 0

        pi = torch.nn.Softmax(dim=-2)(torch.tensor(theta))

        action_weights = pi[state[0] * 5 + state[1]]

        # Epsilon-greedy action selection
        if random.random() < 0.8:
            # Choose action with argmax. Break ties randomly.
            action = rand_argmax(action_weights.numpy())

        else:
            action = random.randint(0, 3)

        # compute gradient of policy w.r.t. theta
        jacobian = softmax_grad(pi)
        jacobian = jacobian.reshape(domain.num_states, domain.num_actions, domain.num_states, domain.num_actions)

        reward, done = domain.take_action(action, reward_fn = reward_fn)
        human_reward = reward
        total_reward += reward

        if done:
            break

        theta += learning_rate * \
                    jacobian[state[0] * 5 + state[1]][action].numpy() * \
                    human_reward * \
                    1.0 / action_weights[action].numpy()
        state = np.array(domain.position)[:]

    return (total_reward, done, theta, num_steps)
    # todo


if __name__ == "__main__":
    domain = Gridworld()

    # print ("training oracle")
    # oracle_parameters = cartpole_oracle.train(domain)
    # print ("oracle trained")

    n_state = domain.num_states
    n_action = domain.num_actions

    theta = np.zeros((n_state, n_action))

    total_num_steps_0 = []

    total_num_steps_1 = []

    for i in range(0, 100):
        total_reward, done, theta, num_steps = COACH(domain, theta, reward_fn = 0)
        total_num_steps_0.append(num_steps)
        print ("total reward " + str(total_reward) + ", done: " + str(done))

    for i in range(0, 100):
        total_reward, done, theta, num_steps = COACH(domain, theta, reward_fn = 1)
        total_num_steps_1.append(num_steps)
        print ("total reward " + str(total_reward) + ", done: " + str(done))
        # for j, grad in enumerate(grads):
        #     weights += 0.001 * grad * (total_reward - j)
    plt.plot(np.log(total_num_steps_0), label = "task based")
    plt.plot(np.log(total_num_steps_1), label = "policy independent")
    plt.legend()
    plt.ylim((0,8))
    plt.show()
