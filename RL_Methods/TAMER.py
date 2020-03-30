import sys
sys.path.append("../Domains")

import numpy as np
import datetime, time
import socket
import threading
import pickle

from scipy import integrate, stats
from multiprocessing import Queue
from copy import deepcopy

from cartpole import CartPole
import cartpole_oracle
from TAMER_creditor import Creditor

HUMAN_RESPONSE_TIME_MINIMUM = 0.2

def tamer_with_credit_assignment (domain,
                                  stepSize = 0.05,
                                  windowSize = 0.2,
                                  creditHistoryLen = 1):
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
    # oracle_parameters = cartpole_oracle.train(domain)
    domain.env.render()

    creditor = Creditor(windowSize, creditHistoryLen)
    state = domain.get_state_vec()
    features = domain.get_current_features()
    num_features = len(features)
    weights = np.zeros(num_features)

    timestamp = 0
    h = 0
    action = None
    stepsTaken = 0
    reward = 0

    while True:
        print ("Reward? ")
        h = input()
        if h == "":
            h = 0
        elif h == "-":
            h = -1
        else:
            h = int(h)

        # if human reinforcement is not 0, update weights
        if h != 0:
            # # Update weights
            print ("Nonzero feedback received!")
            print ("Feedback: " + str(h))
            creditedFeatures = np.zeros(num_features)
            for (featureVec_t , time_t) in creditor.getHistoryWindow():
                creditVal_t = creditor.assignCredit(time_t)
                print ("Time: " + str(time_t))
                print ("Credit Value: " + str(creditVal_t))
                featureVec_t = np.multiply(creditVal_t, featureVec_t)
                creditedFeatures = creditedFeatures + featureVec_t

            error = h - np.dot(weights, creditedFeatures)
            print ("Error " + str(error))
            weights = np.add(weights, np.multiply(stepSize * error, creditedFeatures))
            print ("Weights: " + str(weights))
            print ("FEEDBACK INCORPORATED")

        # What state are we in?
        state = domain.get_current_features()
        print ("Starting state " + str(state))
        print ("Weights: " + str(weights))

        action = 0 if np.dot(weights, state) < 0 else 1

        print ("Last action: " + str(action))

        env_reward, done = domain.take_action(action)
        if not done: reward += env_reward
        else: reward = 0
        state = domain.get_state_vec()
        features = domain.get_current_features()
        creditor.updateWindow(features, timestamp)
        timestamp += 1

        print ("Episode reward: " + str(reward) + "\n")

        domain.env.render()
        time.sleep(0.1)

def main():
    # Run environment
    domain = CartPole()
    tamer_with_credit_assignment(domain)

main()
