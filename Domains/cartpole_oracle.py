from cartpole import CartPole
import numpy as np
import matplotlib.pyplot as plt
import time

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

if __name__ == "__main__":
    domain = CartPole()
    trained_params = train(domain)
    print (trained_params)

    while True:
        print ("p to play, q to quit")
        show = input()
        if show == "q":
            domain.env.close()
            break
        show_policy(domain, trained_params)
