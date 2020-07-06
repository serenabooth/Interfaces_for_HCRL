from copy import deepcopy
import numpy as np

class DummyWindow():
    def close(self):
        pass

def copyenv(env):
    """
    Credit: https://github.com/openai/gym/issues/1231
    """
    if env.env.viewer == None:
        return deepcopy(env)
    window = env.env.viewer.window
    env.env.viewer.window = None

    new_env = deepcopy(env)

    new_env.env.viewer.window = DummyWindow()
    env.env.viewer.window = window

    return new_env
