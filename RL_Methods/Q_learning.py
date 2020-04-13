import sys
sys.path.append("../Domains")
from cartpole import CartPole
from gridworld import Gridworld

import cartpole_oracle

import numpy as np

def rand_argmax(b):
  return np.argmax(np.random.random(b.shape) * (b==b.max()))


def Q_LEARNING(domain, q_table, learning_rate = 0.05, discount_factor = 0.99):
    state = domain.reset()
    total_reward = 0
    num_steps = 0
    alpha = learning_rate
    gamma = discount_factor
    action_history = []

    for _ in range(0, 1000):
        action = rand_argmax(q_table[state[0]][state[1]])

        action_history.append(action)

        reward, done = domain.take_action(action, reward_fn = 0)

        new_state = np.array(domain.position)
        total_reward += reward
        if done:
            break

        old_value = q_table[state[0]][state[1]][action]
        next_max = np.max(q_table[new_state[0]][new_state[1]])

        new_value = (1 - alpha) * old_value + alpha * (reward + gamma * next_max)
        q_table[state[0]][state[1]][action] = new_value
        state = new_state

    print (action_history[0:10])
    return (total_reward, done, q_table)

if __name__ == "__main__":
    domain = Gridworld()
    q_table = np.zeros((8, 5, 4))

    for _ in range(0, 100):

        total_reward, done, q_table = Q_LEARNING(domain, q_table)
        print (total_reward)
