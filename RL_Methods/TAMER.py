import sys
sys.path.append("../Domains")

import numpy as np
import datetime, time
import socket
import threading
import pickle
import random
import matplotlib.pyplot as plt

from scipy import integrate, stats
from multiprocessing import Queue
from copy import deepcopy

from cartpole import CartPole
import cartpole_oracle
from TAMER_creditor import Creditor

HUMAN_RESPONSE_TIME_MINIMUM = 0.2

def evaluate_TAMER_CARTPOLE(domain, weights, reward_fn = 0):
    """
    Evaluates TAMER. Should be called periodically during training,
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
            action = 0 if np.dot(weights, state) < 0 else 1
            reward, done = domain.take_action(action, reward_fn = reward_fn)

            state = np.array(domain.get_current_features())
            episode_reward += reward
            if done:
                break
        average_reward.append(episode_reward)
    return average_reward

def tamer_with_credit_assignment (domain,
                                  num_episodes = 100,
                                  stepSize = 0.01,
                                  windowSize = 0.6,
                                  creditHistoryLen = 5,
                                  oracle_parameters = None):
    """
    http://www.cs.utexas.edu/~sniekum/classes/RLFD-F16/papers/Knox09.pdf
    Implementation of Algorithm 2, TAMER with credit assignment

    Params
    ------
        stepSize : float
            learning rate. TAMER recommends values < 0.01
        windowSize : float
            number of seconds over which human feedback may be amortized
        creditHistoryLen : int
            number of timestamps for credit history recollection

    Returns
    -------
        None
    """
    rewards_all_episodes = []
    evaluated_episodes = []

    weights = np.zeros(domain.obs_size)

    for episode_id in range(0, num_episodes):
        state = domain.reset()
        timestamp = 0
        creditor = Creditor(windowSize, creditHistoryLen)


        human_reward = 0
        action = None
        stepsTaken = 0
        episode_reward = 0

        for num_steps in range(0, 1000):
            # domain.env.render()

            # if human reinforcement is not 0, update weights
            if human_reward != 0:
                # # Update weights
                # print ("Nonzero feedback received!")
                # print ("Feedback: " + str(human_reward))
                creditedFeatures = np.zeros(domain.obs_size)


                for (featureVec_t , time_t) in creditor.getHistoryWindow():
                    creditVal_t = creditor.assignCredit(time_t)

                    # print ("Time: " + str(time_t))
                    # print ("Credit Value: " + str(creditVal_t))
                    featureVec_t = np.multiply(creditVal_t, featureVec_t)
                    creditedFeatures = creditedFeatures + featureVec_t
                    # print ("Credited Features: " + str(creditedFeatures))

                error = human_reward - np.dot(weights, creditedFeatures)
                # print ("Error " + str(error))
                weights = np.add(weights, np.multiply(stepSize * error, creditedFeatures))
                # print ("Weights: " + str(weights))
                # print ("FEEDBACK INCORPORATED")


            action = 0 if np.dot(weights, state) < 0 else 1

            if random.random() < 1:
                human_reward = cartpole_oracle.ask_oracle_advice(domain, oracle_parameters, action)
            else:
                human_reward = 0


            env_reward, done = domain.take_action(action)
            # print ("Last action: " + str(action))
            episode_reward += env_reward
            if done:
                break

            state = domain.get_current_features()
            creditor.updateWindow(state, timestamp)
            timestamp += 1

        if episode_id % 3 == 0:
            rewards_all_episodes.append(evaluate_TAMER_CARTPOLE(domain, weights))
            evaluated_episodes.append(episode_id)
        # print ("Episode score: " + str(episode_reward))
    return rewards_all_episodes, evaluated_episodes


def test_cartpole():
    # Run environment
    domain = CartPole()

    print ("training oracle")
    # oracle_parameters = cartpole_oracle.train(domain)
    oracle_parameters =  [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
    print (oracle_parameters)
    print ("oracle trained")

    total_rewards = []
    for _ in range(0,5):
        episode_total_rewards, eval_episodes = tamer_with_credit_assignment(domain, oracle_parameters = oracle_parameters)
        if total_rewards == []:
            total_rewards = episode_total_rewards

        for j in range(0, len(eval_episodes)):
            total_rewards[j] = total_rewards[j] + episode_total_rewards[j]

    print (total_rewards)

    mean_rewards = np.mean(total_rewards, axis = 1)
    rewards_std = np.std(total_rewards, axis=1)

    plt.plot(eval_episodes, mean_rewards)
    plt.fill_between(eval_episodes, mean_rewards - rewards_std,
                                mean_rewards + rewards_std, alpha=0.2)

    # plt.legend()
    plt.ylim((0,500))
    plt.show()


if __name__ == "__main__":
    test_cartpole()
