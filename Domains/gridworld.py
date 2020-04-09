from domain import Domain
from enum import Enum
import numpy as np

class Gridworld(Domain):
    env = None
    last_observation = None
    num_actions = None
    obs_size = None
    position = None
    goal = None
    def __init__(self):
        # Use OpenAI Gym for CartPole environment
        self.env = np.zeros(shape = (8,5))
        print (self.env)
        self.position = [0,0]
        self.env[self.position[0]][self.position[1]] = 1
        self.goal = [7,4]


        self.env[self.goal[0]][self.goal[1]] = 2


        self.last_observation = self.position
        self.num_actions = 4
        self.obs_size = 2

    def reset(self):
        self.position = [0,0]
        self.env[self.position[0]][self.position[1]] = 1
        self.goal = [7,4]
        self.last_observation = self.position
        return np.array(self.last_observation)

    def get_state_vec(self):
        return self.last_observation

    def get_current_features(self):
        return self.last_observation

    def get_future_features(self, state, action):
        pass

    def get_possible_actions(self, constraint=None):
        return ["UP", "DOWN", "LEFT", "RIGHT"]

    def take_action(self, action):
        if action == 0:
            action = "UP"
        if action == 1:
            action = "DOWN"
        if action == 2:
            action = "LEFT"
        if action == 3:
            action = "RIGHT"

        done = False
        self.env[self.position[0]][self.position[1]] = 0


        if action == "DOWN" and self.position[0] < 7:
            self.position[0] += 1
        if action == "UP" and self.position[0] > 0:
            self.position[0] -= 1
        if action == "RIGHT" and self.position[1] < 4:
            self.position[1] += 1
        if action == "LEFT" and self.position[1] > 0:
            self.position[1] -= 1

        self.env[self.position[0]][self.position[1]] = 1
        self.env[self.goal[0]][self.goal[1]] = 2

        done = self.position == self.goal
        if done:
            reward = 5
        elif self.position[0] >= 1 and self.position[0] <= 6:
            reward = -1
        else:
            reward = 0

        return (reward, done)



if __name__ == "__main__":
    gridworld = Gridworld()
    print (gridworld.env)

    totalreward = 0
    for _ in range(0, 10):
        reward, done = gridworld.take_action("RIGHT")
        totalreward += reward
        if done:
            break
        # print (gridworld.env)
        reward, done = gridworld.take_action("DOWN")
        totalreward += reward
        if done:
            break
        # # print (gridworld.env)
        # reward, done = gridworld.take_action("LEFT")
        # totalreward += reward
        # if done:
        #     break
        #
        # # print (gridworld.env)
        # reward, done = gridworld.take_action("UP")
        # totalreward += reward
        # if done:
        #     break
    print (totalreward)
