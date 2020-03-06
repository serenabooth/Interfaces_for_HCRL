from cartpole import CartPole
import numpy as np
import matplotlib.pyplot as plt
import time, random
from copy import deepcopy
from gym.wrappers.monitoring import stats_recorder, video_recorder

def show_policy(env, parameters):
    env.reset()
    observation = env.last_observation
    totalreward = 0
    while True:
        env.env.render()
        time.sleep(0.01)

        action = 0 if np.dot(parameters, observation) < 0 else 1
        reward, done = env.take_action(action)
        totalreward += reward
        observation = env.last_observation
        if done:
            print (totalreward)
            break

def run_episode(env, parameters):
    env.reset()
    observation = env.last_observation
    totalreward = 0
    counter = 0
    for _ in range(200):
        action = 0 if np.dot(parameters,observation) < 0 else 1
        reward, done = env.take_action(action)
        observation = env.last_observation

        totalreward += reward
        counter += 1
        if done:
            break

    return totalreward

def train(env):
    """
    Randomly generate new parameters; see if they achieve a sufficiently high score.
    """
    episodes_per_update = 5
    noise_scaling = 0.2
    parameters = np.random.rand(4) * 2 - 1
    bestreward = 0
    counter = 0
    avg_reward = 0

    while bestreward < 1000:
        counter += 1
        newparams = parameters + (np.random.rand(4) * 2 - 1)*noise_scaling
        reward = 0
        for _ in range(episodes_per_update):
            run = run_episode(env,newparams)
            reward += run
        if reward > bestreward:
            bestreward = reward
            parameters = newparams

    print ("Best reward: " + str(bestreward))
    return parameters

def ask_oracle_advice(env, parameters, proposed_action):
    observation = env.last_observation
    action = 0 if np.dot(parameters, observation) < 0 else 1

    if proposed_action == action:
        return 1
    else:
        return -1

def visualize_policy(env, parameters, num_traj = 1):
    done = False

    while not done:
        env.reset()
        observation = deepcopy(env.last_observation)

        action_0 = []
        action_1 = []

        # take a look at how other variations may have performed
        if random.random() < 0.05:
            for i in range(0, 5):
                s_tmp = deepcopy(observation)
                s_tmp[2] = random.gauss(s_tmp[2], 0.001) #resample a single parameter
                # print ("Original " + str(observation))
                # print ("New " + str(s_tmp))

                action = 0 if np.dot(parameters,s_tmp) < 0 else 1

                env.observation_space = s_tmp
                env.env.render()

                if action == 0:
                    action_0.append(s_tmp)
                elif action == 1:
                    action_1.append(s_tmp)

            print ("I move left in: " + str(action_0))
            print ("I move right in: " + str(action_1))

        env.observation_space = observation

        # take the next step
        action = 0 if np.dot(parameters,observation) < 0 else 1
        reward, done = env.take_action(action)
        observation = deepcopy(env.last_observation)
        if done:
            print ("Done")
            exit()


if __name__ == "__main__":
    domain = CartPole(recording=True)
    trained_params = train(domain)
    print (trained_params)

    while True:
        print ("p to play, q to quit")
        show = input()
        if show == "q":
            domain.env.close()
            break
        show_policy(domain, trained_params)
        visualize_policy(domain, trained_params)
