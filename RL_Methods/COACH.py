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
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Categorical

import matplotlib.pyplot as plt

state_histories = []

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
    s = np.array(s)
    SM = s.reshape((-1,1))
    jacobian = np.diagflat(s) - np.dot(SM, SM.T)
    return jacobian

def evaluate_COACH(domain, theta, reward_fn = 0):
    """
    Evaluates COACH. Should be called periodically during training,
    to generate learning curves.

    Params
    ------
        domain : Domain
            Specifies the environment (e.g. CartPole)
        theta : np matrix
            Weights for decision-making
        reward_fn : int
            Optional; used to report environment reward.
    Returns
    -------
        average_num_steps : list
            A list of integers corresponding to the number of steps
            taken in each episode
    """
    average_num_steps = []
    for _ in range(0, 5):
        state = domain.reset()[:]

        # limit the possible number of steps
        for num_steps in range(0, 2000):

            # get the action weights
            pi = torch.nn.Softmax(dim=-1)(torch.tensor(theta))
            action_weights = pi[state[0]][state[1]]

            # take an action
            if random.random() < 0.8:
                action = randargmax(action_weights.numpy())
            else:
                action = random.randint(0, domain.num_actions-1)
            reward, done = domain.take_action(action, reward_fn = reward_fn)
            state = np.array(domain.position)[:]

            if done:
                break
        average_num_steps.append(num_steps)
    return average_num_steps


def evaluate_COACH_CARTPOLE(domain, theta, reward_fn = 0):
    """
    Evaluates COACH. Should be called periodically during training,
    to generate learning curves.

    Params
    ------
        domain : Domain
            Specifies the environment (e.g. CartPole)
        theta : np matrix
            Weights for decision-making
        reward_fn : int
            Optional; used to report environment reward.
    Returns
    -------

    """
    average_reward = []
    n_action = domain.num_actions

    for _ in range(0, 5):
        episode_reward = 0
        state = domain.reset()

        # limit the possible number of steps
        for num_steps in range(0, 500):

            # get the action weights
            action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(theta)))
            action = np.random.choice(n_action, p=action_weights)

            reward, done = domain.take_action(action, reward_fn = reward_fn)
            state = np.array(domain.last_observation)
            episode_reward += reward
            if done:
                break
        average_reward.append(episode_reward)
    return average_reward

def append_state_history(state):
    if len (state_histories) > 16:
        idx = random.randint(0,16)
        state_histories[idx] = state
    else:
        state_histories.append(state)


def compute_expected_actions(domain, theta):
    expected_actions = []
    for state in state_histories:

        current_state = domain.get_state_vec()

        domain.env.observation_space = state

        tmp_state = domain.get_fea

        action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(theta)))
        action = np.argmax(action_weights)
        expected_actions.append(action)
        domain.env.observation_space = current_state

    return expected_actions

def get_human_reward(domain, theta, action, oracle_parameters=None):
    # human_reward = cartpole_oracle.ask_oracle_advice(domain, oracle_parameters, action)
    domain.env.render()
    print ("Last action: " + str(action))
    print ("Reward?")
    try:
        human_reward = input()
    except KeyboardInterrupt:
        sys.exit(0)

    if human_reward == "v":
        print (state_histories)
        print (domain.clusters(state_histories, k = 5))
        # print (compute_expected_actions(domain, theta))
        # domain.save_imagined_action_screenshot(state=state_histories[:-1], planned_action = 0)
    else:
        try:
            human_reward = int(human_reward)
        except:
            print ("no human reward")
            human_reward = 0

    return human_reward

def COACH_CARTPOLE(domain,
                   num_episodes = 200,
                   trace_set = [0.99],
                   delay = 0,
                   learning_rate = 0.05,
                   reward_fn = 0,
                   oracle_parameters = None):
    """
    Implements COACH, a method for human-centered RL

    MacGlashan, James, et al. "Interactive learning from policy-dependent human feedback."
    International Conference on Machine Learning. 2017.
    https://medium.com/samkirkiles/reinforce-policy-gradients-from-scratch-in-numpy-6a09ae0dfe12

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
        rewards_all_episodes : list of lists of ints
            Every x episodes, we run our model y times and record the scores
        evaluated_episodes : list of ints
            A list of which episodes were evaluated. Used for plotting.
    """
    #TODO - implement delay

    n_state = domain.obs_size
    n_action = domain.num_actions

    theta = np.zeros((n_state, n_action))

    rewards_all_episodes = []
    evaluated_episodes = []

    for episode_id in range(0, num_episodes):
        state = domain.reset()

        grads = []
        rewards = []
        episode_reward = 0

        eligibility_traces = {}
        for trace_val in trace_set:
            eligibility_traces[trace_val] = np.zeros(theta.shape)

        for num_steps in range(0, 1000):
            # store state state_histories
            # this should be replaced with k-means clustering!
            if random.random() < 0.2:
                print ("appending state")
                append_state_history(state)

            # determine which action to take (probabilistic)
            action_weights = torch.nn.Softmax(dim=-1)(torch.tensor(state.dot(theta)))
            action = np.random.choice(n_action, p=action_weights)

            # compute gradient
            dsoftmax = softmax_grad(action_weights)[action]
            dlog = dsoftmax / action_weights[action].numpy()
            grad = state[None,:].T.dot(dlog[None,:])
            grads.append(grad)

            # take action, update reward tracking
            reward, done = domain.take_action(action, reward_fn = reward_fn)
            state = domain.last_observation
            if done:
                break

            # get human feedback
            human_reward = get_human_reward(domain, theta, action, oracle_parameters)
            # if suggested_action != None:
            #     action = suggested_action
            #     reward, done = domain.take_action(action, reward_fn = reward_fn)

            rewards.append(reward)
            episode_reward += reward


            for trace_val in trace_set:
                eligibility_traces[trace_val] = trace_val * eligibility_traces[trace_val]
                eligibility_traces[trace_val] += grad

            selected_trace = domain.select_trace(trace_set, human_reward)
            theta_delta = learning_rate * human_reward * eligibility_traces[selected_trace]
            theta = theta + theta_delta

        print ("STARTING NEW EPISODE: " + str(episode_id))
        print ("Episode score: " + str(episode_reward))

        if episode_id % 1 == 0:
            rewards_all_episodes.append(evaluate_COACH_CARTPOLE(domain, theta))
            evaluated_episodes.append(episode_id)

    return rewards_all_episodes, evaluated_episodes


def COACH_GRIDWORLD(domain, num_episodes = 100, trace_set = [0.1], delay = 0, learning_rate = 0.05, reward_fn = 0):
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
        total_steps : list
            a list of how many steps were taken on each evaluation
        evaluated_episodes : list
            a list of which episodes were evaluated (e.g. 0, 3, 6, ...)
    """
    #TODO - implement delay

    n_state = domain.num_states
    assert (type(n_state) == tuple)
    n_action = domain.num_actions

    theta = np.zeros(n_state + (n_action,))
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

            pi = torch.nn.Softmax(dim=-1)(torch.tensor(theta))
            action_weights = pi[state[0]][state[1]]

            if random.random() < 0.8:
                action = randargmax(action_weights.numpy())
            else:
                action = random.randint(0, domain.num_actions-1)

            # compute gradient
            jacobian = softmax_grad(pi)
            jacobian = jacobian.reshape(theta.shape + theta.shape)

            reward, done = domain.take_action(action, reward_fn = reward_fn)
            human_reward = reward
            episode_reward += reward

            selected_trace = domain.select_trace(trace_set, human_reward)

            if done:
                break

            for trace_val in trace_set:
                eligibility_traces[trace_val] = trace_val * eligibility_traces[trace_val]
                eligibility_traces[trace_val] += 1.0 / action_weights[action].numpy() * \
                                                 jacobian[state[0]][state[1]][action]

            theta_delta = learning_rate * human_reward * eligibility_traces[selected_trace]
            theta = theta + theta_delta
            state = np.array(domain.position)[:]

        if episode_id % 1 == 0:
            evaluated_episodes.append(episode_id)
            evaluated_num_steps = evaluate_COACH(domain, theta)
            total_steps.append(evaluated_num_steps)

    return total_steps, evaluated_episodes

def gridworld_test():
    domain = Gridworld()

    for reward_fn in [1]:

        total_num_steps, eval_episodes = COACH_GRIDWORLD(domain, trace_set = [0.1], reward_fn = reward_fn)
        log_mean_steps = np.log(np.mean(total_num_steps, axis = 1))
        log_num_steps_std = np.std(np.log(total_num_steps), axis=1)

        label = ""
        if reward_fn == 0:
            label = "task based"
        elif reward_fn == 1:
            label = "COACH (policy indepdendent)"
        plt.plot(eval_episodes, log_mean_steps, label = label)
        plt.fill_between(eval_episodes,
                            log_mean_steps - log_num_steps_std,
                            log_mean_steps + log_num_steps_std,
                            alpha=0.2)

    plt.legend()
    plt.ylim((0,8))
    plt.show()

if __name__ == "__main__":
    gridworld_test()
