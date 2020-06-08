from domain import Domain
import environment_helpers
from enum import Enum
from copy import deepcopy
import numpy as np
import random
import gym
import time

class MountainCar(Domain):
    env = None
    last_observation = None
    num_actions = None
    obs_size = None

    # Feature normalization parameters
    max = None
    min = None

    # Radial Basis Function parameters
    num_rbf = None
    width = None
    rbf_sigma = None
    num_ind = None
    rbf_den = None
    centers = None

    def __init__(self):
        # Use OpenAI Gym for CartPole environment
        self.env = gym.make('MountainCar-v0')
        obs = self.env.reset()

        self.last_observation = obs

        self.num_actions = self.env.action_space.n

        self.max = self.env.observation_space.high
        self.min = self.env.observation_space.low
        self.init_rbf()

    def init_rbf(self):
        """
        Credit: https://gist.github.com/evangravelle/56defd6d01ee738f7cbeb84013145a43
        """
        # TODO: where did this 3 come from?
        # TODO: generally better justify
        self.num_rbf = 3 * np.ones(self.num_actions).astype(int)
        self.num_ind = np.prod(self.num_rbf)
        self.width = 1. / (self.num_rbf - 1.)
        self.rbf_sigma = self.width[0] / 2.
        self.rbf_den = 2 * self.rbf_sigma ** 2

        # Initialize RBF centers
        self.obs_size = self.env.observation_space.high.size

        print ("NUM IND " + str(self.num_ind))
        self.centers = np.zeros((self.num_ind, self.obs_size))
        for i in range(self.num_rbf[0]):
            for j in range(self.num_rbf[1]):
                self.centers[i*self.num_rbf[1] + j, :] = (i * self.width[1], j * self.width[0])
        print (self.centers)


    def normalize_features (self, obs):
        """
        Scale observation to vector of {0,1} values.

        Params
        ------
            self :
            obs :

        Returns
        -------
            np array of floats
                Each state value is scaled between 0 and 1
        """
        return np.subtract(obs, self.min)/np.subtract(self.max, self.min)

    def radial_basis_features(self, obs):
        """
        Returns an ndarray of radial basis function activations
        """
        phi = np.zeros(self.num_ind)
        for k in range(self.num_ind):
            phi[k] = np.exp(-np.linalg.norm(obs - self.centers[k, :]) ** 2 / self.rbf_den)
        return phi

    def reset(self):
        """
        Reset to starting state
        """
        obs = self.env.reset()
        self.last_observation = obs
        return self.radial_basis_features(self.normalize_features(obs))

    def get_state_vec(self):
        """
        Return a copy of self.env.observation_space

        Params
        ------
            self : a mountaincar instance
                Should have an instantiated env class variable
        Returns
        -------
            observation_space : Box
                Corresponds to a system state
        """
        return deepcopy(self.env.observation_space)

    def get_current_features(self):
        obs = self.last_observation
        return self.radial_basis_features(self.normalize_features(obs))

    def get_future_features(self, action):
        """
        Lookahead as if action was performed.

        Params
        ------
            self : a mountaincar instance
            state :
            action :

        Returns
        -------
            obs : a numpy array
        """
        env_copy = environment_helpers.copyenv(self.env)
        obs, _, _, _ = env_copy.step(action)
        self.last_observation = obs
        return self.radial_basis_features(self.normalize_features(obs))

    def get_possible_actions(self):
        return range(self.env.action_space.n)

    def take_action(self, action, reward_fn = 0):
        self.last_observation, env_reward, done, info = self.env.step(action)
        if done:
            self.env.reset()
        return (env_reward, done)

    def select_trace(self, trace_set, reward):
        """
        Select a trace.
        This could be done cleverly (high reward -> high trace value, low reward -> low trace value)
        Here we just always return the max.

        Params
        ------
            trace_set : list
            reward : int
        Returns
        -------
            float
                corresponds to picked trace value (e.g. 0.9)
        """
        return np.max(trace_set)

def human_direct_control():
    mountaincar = MountainCar()
    mountaincar.env.render()
    move = 0
    reward = 0
    while str(move) != "quit":
        print ("If you move left: " + str(mountaincar.get_future_features(0)))
        print ("If you move right: " + str(mountaincar.get_future_features(2)))

        move = input()
        env_reward, done = mountaincar.take_action(int(move))
        if not done:
            reward += env_reward
        else:
            reward = 0
        print ("REWARD " + str(reward))
        mountaincar.env.render()

    mountaincar.env.close()

if __name__ == "__main__":
    human_direct_control()
