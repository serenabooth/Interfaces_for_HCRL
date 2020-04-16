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
  """ a random tie-breaking argmax """
  return np.argmax(np.random.random(b.shape) * (b==b.max()), **kw)

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

def evaluate_COACH(domain, theta, reward_fn = 0):
    average_num_steps = []
    for _ in range(0, 5):
        state = domain.reset()[:]

        for num_steps in range(0, 2000):

            pi = torch.nn.Softmax(dim=-1)(torch.tensor(theta))
            action_weights = pi[state[0]][state[1]]

            if random.random() < 0.8:
                action = randargmax(action_weights.numpy())
            else:
                action = random.randint(0, domain.num_actions-1)


            # compute gradient
            jacobian = softmax_grad(pi)
            jacobian = jacobian.reshape(40,4,40,4)

            reward, done = domain.take_action(action, reward_fn = reward_fn)
            state = np.array(domain.position)[:]

            if done:
                break
        average_num_steps.append(num_steps)
    return average_num_steps

def COACH(domain, num_episodes = 100, trace_set = [0], delay = 0, learning_rate = 0.05, reward_fn = 0):
    """
    Implements COACH, a method for human-centered RL

    MacGlashan, James, et al. "Interactive learning from policy-dependent human feedback."
    International Conference on Machine Learning. 2017.

    Params
    ------
        num_episodes : int
            The number of episodes to train for
        trace_set : list
            A list containing all eligibility trace values - e.g. [0.3, 0.9]
        delay : int
            An int telling us how many timesteps human feedback is delayed
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

    n_state = domain.num_states
    n_action = domain.num_actions

    theta = np.zeros((n_state[0], n_state[1], n_action))

    evaluated_episodes = []
    total_steps = []

    for episode_id in range(0, num_episodes):
        state = domain.reset()[:]
        episode_reward = 0
        done = False
        theta_delta = []

        eligibility_traces = {}
        for trace_val in trace_set:
            eligibility_traces[trace_val] = np.zeros(theta.shape)

        for num_steps in range(0, 2000):
            human_reward = 0

            # print(torch.tensor(theta).shape)
            pi = torch.nn.Softmax(dim=-1)(torch.tensor(theta))

            action_weights = pi[state[0]][state[1]]

            if random.random() < 0.8:
                action = randargmax(action_weights.numpy())
            else:
                action = random.randint(0, domain.num_actions-1)

            # compute gradient
            jacobian = softmax_grad(pi)
            jacobian = jacobian.reshape(8,5,4,8,5,4)

            reward, done = domain.take_action(action, reward_fn = reward_fn)
            human_reward = reward
            episode_reward += reward

            selected_trace = domain.select_trace(trace_set, human_reward)

            if done:
                break

            for trace_val in trace_set:
                eligibility_traces[trace_val] = trace_val * eligibility_traces[trace_val]
                eligibility_traces[trace_val] += 1.0 / action_weights[action].numpy() * jacobian[state[0]][state[1]][action].numpy()

            theta_delta = learning_rate * human_reward * eligibility_traces[selected_trace]
            theta = theta + theta_delta
            state = np.array(domain.position)[:]

        if episode_id % 3 == 0:
            evaluated_episodes.append(episode_id)
            evaluated_num_steps = evaluate_COACH(domain, theta)
            total_steps.append(evaluated_num_steps)

    return total_steps, evaluated_episodes
    # todo

def gridworld_test():
    domain = Gridworld()

    for reward_fn in [0,1]:

        total_num_steps, eval_episodes = COACH(domain, trace_set = [0], reward_fn = reward_fn)
        log_mean_steps = np.log(np.mean(total_num_steps, axis = 1))
        log_num_steps_std = np.std(np.log(total_num_steps), axis=1)

        label = ""
        if reward_fn == 0:
            label = "task based"
        elif reward_fn == 1:
            label = "policy indepdendent"
        plt.plot(eval_episodes, log_mean_steps, label = label)
        plt.fill_between(eval_episodes, log_mean_steps - log_num_steps_std,
                                        log_mean_steps + log_num_steps_std, alpha=0.2)

    plt.legend()
    plt.ylim((0,8))
    plt.show()

if __name__ == "__main__":
    gridworld_test()
