from domain import Domain
from enum import Enum
from copy import deepcopy
import environment_helpers
import numpy as np
import random
import gym
import time

class CartPole(Domain):
    env = None
    last_observation = None
    num_actions = None
    obs_size = None

    def __init__(self, recording=False):
        # Use OpenAI Gym for CartPole environment
        self.env = gym.make('CartPole-v1')
        if recording:
            self.env = gym.wrappers.Monitor(self.env, "./vid", video_callable=lambda episode_id: True, force=True)

        obs = self.env.reset()

        self.last_observation = obs
        self.num_actions = self.env.action_space.n

        self.obs_size = self.env.observation_space.high.size

    def reset(self):
        """
        Reset to starting state
        """
        obs = self.env.reset()
        self.last_observation = obs

    def get_state_vec(self):
        """
        Return a copy of self.env.observation_space

        Params
        ------
            self : a cartpole instance
                Should have an instantiated env class variable
        Returns
        -------
            observation_space : Box
                Corresponds to a system state
        """
        return deepcopy(self.env.observation_space)

    def get_current_features(self):
        return self.last_observation

    def get_future_features(self, action):
        """
        Lookahead as if action was performed.

        Params
        ------
            self : a cartpole instance
            state :
            action :

        Returns
        -------
            obs : a numpy array
        """
        env_copy = environment_helpers.copyenv(self.env)
        obs, _, _, _ = env_copy.step(action)
        return obs

    def get_possible_actions(self):
        return range(self.env.action_space.n)

    def take_action(self, action):
        self.last_observation, env_reward, done, info = self.env.step(action)

        if done:
            self.env.reset()

        return (env_reward, done)

def human_direct_control():
    cartpole = CartPole()
    cartpole.env.render()
    move = 0
    reward = 0
    while str(move) != "quit":
        print ("If you move left: " + str(cartpole.get_future_features(0)))
        print ("If you move right: " + str(cartpole.get_future_features(1)))

        move = input()
        env_reward, done = cartpole.take_action(int(move))
        if not done:
            reward += env_reward
        else:
            reward = 0
        print ("REWARD " + str(reward))
        cartpole.env.render()

    cartpole.env.close()

if __name__ == "__main__":
    human_direct_control()
