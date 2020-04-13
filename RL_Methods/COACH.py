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

def randargmax(b,**kw):
  """ a random tie-breaking argmax"""
  return np.argmax(np.random.random(b.shape) * (b==b.max()), **kw)

def Q_LEARNING(domain, q_table, learning_rate = 0.05, discount_factor = 0.99):
    state = domain.reset()
    total_reward = 0
    num_steps = 0
    alpha = learning_rate
    gamma = discount_factor
    action_history = []

    for _ in range(0, 1000):
        action = randargmax(q_table[state[0]][state[1]])

        action_history.append(action)

        reward, done = domain.take_action(action)

        new_state = np.array(domain.position)
        total_reward += reward
        if done:
            break

        old_value = q_table[state[0]][state[1]][action]
        next_max = np.max(q_table[new_state[0]][new_state[1]])

        new_value = (1 - alpha) * old_value + alpha * (reward + gamma * next_max)
        q_table[state[0]][state[1]][action] = new_value
        state = new_state

    print (action_history[0:10])
    return (total_reward, None, done)

def softmax(x):
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def softmax_grad(s):
    SM = s.reshape((-1,1))
    jacobian = np.diagflat(s) - np.dot(SM, SM.T)
    return jacobian

def rargmax(vector):
    """ Argmax that chooses randomly among eligible maximum indices. """
    # print (vector)
    m = np.amax(vector)
    indices = np.nonzero(vector == m)[0]
    if len(indices) > 0:
        return random.choice(indices)
    print ("Vector " + str(vector) + ", had to randomly pick")
    return random.choice(range(4))

def COACH(domain, theta, learning_rate = 0.05, oracle_parameters = None, reward_fn = 0):
    state = domain.reset()[:]
    grads = []
    total_reward = 0
    done = False
    num_steps = 0
    action_history = []

    for k in range(0, 1000):
        num_steps += 1

        human_reward = 0

        pi = torch.nn.Softmax(dim=-2)(torch.tensor(theta))

        action_weights = pi[state[0] * 5 + state[1]]

        if random.random() < 0.8:
            # m = torch.distributions.Categorical(action_weights)
            # action = m.sample().item()
            action = rargmax(action_weights.numpy())

        else:
            action = random.randint(0, 3)
        # action = rargmax(action_weights.numpy())

        #
        # print ("State " + str(state))
        # print ("Action " + str(action))
        # print (action_weights)

        action_history.append(action)
        # compute gradient
        jacobian = softmax_grad(pi)
        jacobian = jacobian.reshape(40,4,40,4)

        grads.append(jacobian)

        reward, done = domain.take_action(action, reward_fn = reward_fn)
        human_reward = reward
        if done:
            break
        theta_delta = learning_rate * jacobian[state[0] * 5 + state[1]][action].numpy() * human_reward / action_weights[action].numpy()
        theta = theta + theta_delta

        state = np.array(domain.position)[:]

        total_reward += reward


    return (total_reward, done, theta, num_steps)
    # todo


if __name__ == "__main__":
    domain = Gridworld()

    # print ("training oracle")
    # oracle_parameters = cartpole_oracle.train(domain)
    # print ("oracle trained")

    n_state = 8 * 5
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
