from domain import Domain
from enum import Enum
from copy import deepcopy
from PIL import Image, ImageDraw
import environment_helpers
import numpy as np
import random
import gym
import time
import pyglet

class CartPole(Domain):
    env = None
    last_observation = None
    num_actions = None
    obs_size = None

    screenshot_count = 0

    def __init__(self):
        # Use OpenAI Gym for CartPole environment
        self.env = gym.make('CartPole-v1')
        self.last_observation = self.env.reset()
        self.num_actions = self.env.action_space.n
        self.obs_size = self.env.observation_space.high.size


    def set_recording(self, recording=True):
        """
        Start recording videos of episodes.
        Force overwrites previously written videos.

        Params
        ------
            self : CartPole
            recording : Boolean
                Sets whether to record or not
        """
        if recording:
            self.env = gym.wrappers.Monitor(self.env, "./vid", video_callable=lambda episode_id: True, force=True)
        else:
            self.env = gym.wrappers.Monitor(self.env, "./vid", video_callable=False, force=True)


    def reset(self):
        """
        Reset to starting state

        Params
        ------
            env : a cartpole instance

        Returns:
            None
        """
        obs = self.env.reset()
        self.last_observation = obs
        return obs

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
        """
        Return the current features.
        At present, this is just the current state (but is subject to change).

        Params
        ------
            self : a cartpole instance
        Returns
        -------
            list : a state [x x' y y']

        """
        return self.last_observation

    def get_future_features(self, action):
        """
        Lookahead as if action was performed; return that state.

        Params
        ------
            self : a cartpole instance
            action : int

        Returns
        -------
            obs : a numpy array
        """
        env_copy = environment_helpers.copyenv(self.env)
        obs, _, _, _ = env_copy.step(action)
        return obs

    def get_possible_actions(self):
        """
        Return the possible actions

        Params
        ------
            self : a cartpole instance

        Returns
        -------
            list : a list of possible actions
                For CartPole, this is [0, 1]
        """
        return range(self.env.action_space.n)

    def take_action(self, action, record=False, reward_fn = 0):
        """
        Take an action

        Params
        ------
            self : a cartpole instance
            action : int
                the action to take (move left or move right)

        Returns
        -------
            env_reward : int
                How much reward did this action accrue?
            done : Boolean
                Is the episode finished?
        """
        if record:
            self.screenshot_count += 1
            self.save_screenshot("tmp/" + str(self.screenshot_count) + ".png")

        self.last_observation, env_reward, done, info = self.env.step(action)

        if done:
            self.env.reset()

        return (env_reward, done)

    def save_screenshot(self, filename):
        """
        This is a hack. Save a screenshot of the current state.

        Params
        ------
            self : a cartpole instance
            filename : string
                a string for where the file should be saved
        """
        self.env.render()
        pyglet.image.get_buffer_manager().get_color_buffer().save('Screenshots/' + filename)
        self.env.render()

    def save_action_gif(self, action):
        """
        This is a hack. Save a gif showing the result of an action.

        Params
        ------
            self : a cartpole instance
            action : int
                0 or 1, determines whether to move left or right
        """
        self.env.render()
        pyglet.image.get_buffer_manager().get_color_buffer().save("Screenshots/tmp0.png")

        env_reward, done = self.take_action(action)
        self.env.render()

        pyglet.image.get_buffer_manager().get_color_buffer().save("Screenshots/tmp1.png")
        self.env.render()

        pixels0 = Image.open("Screenshots/tmp0.png")
        pixels1 = Image.open("Screenshots/tmp1.png")

        pixels0.save('Screenshots/out.gif', save_all=True,
                                            format='GIF',
                                            append_images=[pixels1],
                                            duration=100,
                                            loop=0)

        return (env_reward, done)

    def save_action_screenshot(self, filename="tmp/out", future_action=None):
        """
        This is a hack. Show a blended image showing the last action.

        Params
        ------
            self : a cartpole instance
            action : int
                0 or 1, determines whether to move left or right
        """
        tmp_filename = None
        for i in range(max(1, self.screenshot_count - 5), self.screenshot_count):

            if tmp_filename == None:
                pixels_a = Image.open("Screenshots/tmp/" + str(i) + ".png")
                print (filename)
                tmp_filename = filename + "_" + str(i) + ".png"
                pixels_a.save("Screenshots/" + tmp_filename)
            else:
                pixels_a = Image.open("Screenshots/" + tmp_filename)
                pixels_b = Image.open("Screenshots/tmp/" + str(i) + ".png")
                Image.blend(pixels_a, pixels_b, 0.7).save("Screenshots/" + tmp_filename)
                print ("This code execuded")


        if future_action != None and tmp_filename != None:
            if future_action == 0:
                composite_im = Image.open("Assets/left.png")
            else:
                composite_im = Image.open("Assets/right.png")

            img = Image.open("Screenshots/" + tmp_filename)
            mask = Image.new("L", img.size, 0)
            draw = ImageDraw.Draw(mask)
            draw.rectangle([(0,0), (600,320)],fill=255)
            im = Image.composite(img, composite_im, mask)
            im.save("Screenshots/" + tmp_filename)


def human_direct_control():
    cartpole = CartPole()
    cartpole.env.render()
    move = 0
    reward = 0
    screenshot_id = 0
    while str(move) != "quit":
        print ("If you move left: " + str(cartpole.get_future_features(0)))
        print ("If you move right: " + str(cartpole.get_future_features(1)))
        print ("0 - move left; 1 - move right; s - save screenshot")
        move = input()
        if move == "s":
            cartpole.save_screenshot(str(screenshot_id) + ".png")
            screenshot_id += 1
            continue
        action = int(move)
        cartpole.save_action_screenshot(future_action=action)
        env_reward, done = cartpole.take_action(action, record=True)

        if not done:
            reward += env_reward
        else:
            reward = 0
        print ("REWARD " + str(reward))
        cartpole.env.render()

    cartpole.env.close()

if __name__ == "__main__":
    human_direct_control()
