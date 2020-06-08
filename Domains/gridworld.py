from domain import Domain
from enum import Enum
import numpy as np

class Actions(Enum):
    UP = 0
    DOWN = 1
    LEFT = 2
    RIGHT = 3


class RewardFunction(Enum):
    TASK_BASED = 0
    POLICY_INDEPENDENT = 1
    IMPROVEMENT = 2

class Gridworld(Domain):
    position = None
    num_states = None
    num_actions = None

    def __init__(self):
        self.position = [0,0]

        self.num_states = (8, 5)
        self.num_actions = 4

    def reset(self):
        self.position = [0,0]

        return self.position

    def get_state_vec(self):
        return self.position

    def get_current_features(self):
        return self.position

    def get_future_features(self, state, action):
        pass

    def get_possible_actions(self, constraint=None):
        return len(Actions)

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

    def task_based_reward(self, initial_position, done):
        if done:
            reward = 5
        elif self.position[0] >= 1 and self.position[0] <= 6 and self.position[1] == 0:
            reward = -1
        else:
            reward = 0

        return reward

    def policy_independent_reward(self, initial_position, done, action):
        if done:
            reward = 5
        elif initial_position[0] == 0 and initial_position[1] == 0 and action == Actions.DOWN:
            reward = 1
        # elif initial_position[0] == 7 and initial_position[1] == 1 and action == Actions.UP:
        #     reward = 1
        elif initial_position[0] >= 0 and initial_position[1] == 1 and action == Actions.RIGHT:
            reward = 1
        elif initial_position[0] >= 0 and initial_position[1] > 1 and action == Actions.UP:
            reward = 1
        elif self.position[0] >= 1 and self.position[0] <= 6 and self.position[1] == 0:
            reward = -1
        else:
            reward = 0
        return reward

    def take_action(self, action, reward_fn = 0):
        done = False

        action = Actions(action)
        reward_fn = RewardFunction(reward_fn)

        initial_position = self.position[:]

        if action == Actions.DOWN and self.position[1] < 4:
            self.position[1] += 1
        elif action == Actions.UP and self.position[1] > 0:
            self.position[1] -= 1
        elif action == Actions.RIGHT and self.position[0] < 7:
            self.position[0] += 1
        elif action == Actions.LEFT and self.position[0] > 0:
            self.position[0] -= 1

        done = self.position[0] == 7 and self.position[1] == 0

        if reward_fn == RewardFunction.TASK_BASED:
            reward = self.task_based_reward(initial_position, done)
        elif reward_fn == RewardFunction.POLICY_INDEPENDENT:
            reward = self.policy_independent_reward(initial_position, done, action)

        return (reward, done)



if __name__ == "__main__":
    gridworld = Gridworld()
    print (gridworld.position)
