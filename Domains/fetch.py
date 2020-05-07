from domain import Domain
from enum import Enum
from copy import deepcopy
import gym
import numpy as np


class FetchPush(Domain):
    env = None
    num_actions = None
    obs_size = None
    last_observation = None
    action_max = None

    def __init__(self):
        # Use OpenAI Gym for FetchReach environment
        self.env = gym.make('FetchReach-v1')
        self.last_observation = self.env.reset()

        self.num_actions = self.env.action_space.shape[0]
        self.obs_size = len(self.last_observation)

        self.action_max = self.env.action_space.high
        self.action_min = self.env.action_space.low

    def reset(self):
        self.last_observation = self.env.reset()
        return self.last_observation

    def get_state_vec(self):
        return self.last_observation

    def get_current_features(self):
        return self.last_observation

    def get_future_features(self, state, action):
        pass

    def get_possible_actions(self, constraint=None):
        pass

    def take_action(self, action):
        self.env.render()

        self.last_observation, env_reward, done, info = self.env.step(action) 
        print (env_reward)
        if done:
            print (info)
            print ("Finished!")
            print (self.last_observation)
            input()
            # exit()

def human_direct_control():
    fetch = FetchPush()
    i = 0
    while True:
        print (i)
        i += 1
        # fetch.env.render()

        action = fetch.env.action_space.sample()
        # print (action)
        fetch.take_action(action)



if __name__ == "__main__":
    human_direct_control()