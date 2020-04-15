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

def COACH(domain,
            theta,
            num_episodes = 100,
            trace_set = [0.9],
            learning_rate = 0.05,
            delay = 0,
            reward_fn = 0):
    """
    Implements COACH, a method for human-centered RL

    MacGlashan, James, et al. "Interactive learning from policy-dependent human feedback."
    International Conference on Machine Learning. 2017.

    Params
    ------
        theta : np.array()
            Contains the weights for decision-making.
        num_episodes : int
            The number of episodes to train for
        trace_set : list
            A list containing all eligibility trace values - e.g. [0.3, 0.9]
        learning_rate : float
            A hyperparameter which determines how rapidly to incorporate feedback
        reward_fn : int
            A parameter passed to the domain to specify which reward function to use

    Returns
    -------
        rewards_all_episodes: list of ints
            A list of rewards obtained from each episode
        num_steps_all_episodes: list of ints
            A list of step counts from each episode
    """
    rewards_all_episodes = []
    num_steps_all_episodes = []

    # initialize traces to zeros
    eligibility_traces = {}
    for trace_val in trace_set:
        eligibility_traces[trace_val] = np.zeros(theta.shape)

    for _ in range(0, num_episodes):
        state = domain.reset()[:]
        total_reward = 0
        done = False
        num_steps = 0


        # limit the number of episode steps
        for _ in range(0, 2000):
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

            for trace_val in eligibility_traces.keys():
                eligibility_traces[trace_val] = trace_val * eligibility_traces[trace_val]
                eligibility_traces[trace_val] += 1.0 / action_weights[action].numpy() * jacobian[state[0] * 5 + state[1]][action].numpy()

            if done:
                print ("Successfully finished episode. Num steps " + str(num_steps))
                break

            trace_val = domain.select_trace(trace_set, human_reward)
            theta += learning_rate * human_reward * eligibility_traces[trace_val]
            state = np.array(domain.position)[:]

        rewards_all_episodes.append(total_reward)
        num_steps_all_episodes.append(num_steps)

    return (rewards_all_episodes, num_steps_all_episodes)

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

    total_reward, total_num_steps_0 = COACH(domain, theta, num_episodes = 50, trace_set = [0], reward_fn = 0)
    total_reward, total_num_steps_1 = COACH(domain, theta, num_episodes = 50, trace_set = [0], reward_fn = 1)

    plt.plot(np.log(total_num_steps_0), label = "task based")
    plt.plot(np.log(total_num_steps_1), label = "policy independent")
    plt.legend()
    plt.ylim((0,8))
    plt.show()
