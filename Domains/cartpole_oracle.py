from cartpole import CartPole
import numpy as np
import matplotlib.pyplot as plt
import time, random
from copy import deepcopy
from gym.wrappers.monitoring import stats_recorder, video_recorder
import argparse
import pyglet
import csv
import json

parser = argparse.ArgumentParser()
parser.add_argument('-params', '--parameters', nargs='+', type=float, default=None)

def show_policy(env, parameters):
    """
    Render a full rollout of the policy, until loss.

    Params
    ------
        env : CartPole
        parameters : list
            An array consisting of [a b c d].
            The policy computes the dot product of [a b c d] and [x x' y y']
    """
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
    """
    Run a full rollout of the policy, until loss.

    Params
    ------
        env : CartPole
        parameters : list
            An array consisting of [a b c d].
            The policy computes the dot product of [a b c d] and [x x' y y']
    """
    env.reset()
    observation = env.last_observation
    totalreward = 0
    counter = 0
    for _ in range(200):
        action = 0 if np.dot(parameters,observation) < 0 else 1
        reward, done = env.take_action(action)
        observation = env.last_observation
        print(observation)

        totalreward += reward
        counter += 1
        if done:
            break

    return totalreward

def train(env):
    """
    Randomly generate new parameters; see if they achieve a sufficiently high score.

    Params
    ------
        env : CartPole
    """
    episodes_per_update = 5
    noise_scaling = 0.2
    parameters = np.random.rand(4) * 2 - 1
    bestreward = 0
    counter = 0
    avg_reward = 0

    while bestreward < 200:
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
    """
    Query the oracle to see how it would evaluate a given action

    Params
    ------
        env : CartPole
        parameters : list
            An array consisting of [a b c d].
            The policy computes the dot product of [a b c d] and [x x' y y']
        proposed_action : int
            0 or 1, meaning left or right
    """
    observation = env.last_observation
    action = 0 if np.dot(parameters, observation) < 0 else 1

    if proposed_action == action:
        return 1
    else:
        return -1

def visualize_policy(env, parameters, num_traj = 2):
    """
    Start exploring techniques for creating visual policy summaries.

    Params
    ------
        env : CartPole
        parameters : list
            An array consisting of [a b c d].
            The policy computes the dot product of [a b c d] and [x x' y y']
        num_traj : int
            The number of rollouts on which to assess policy
    """
    for trajectory in range(num_traj):
        done = False
        env.reset()

        while not done:
            observation = deepcopy(env.last_observation)

            action_0 = []
            action_1 = []

            # take a look at how other variations may have performed
            if random.random() < 0.05:
                for i in range(0, 5):
                    s_tmp = deepcopy(observation)
                    s_tmp[2] = random.gauss(s_tmp[2], 0.05) #resample a single parameter
                    # print ("Original " + str(observation))
                    # print ("New " + str(s_tmp))

                    action = 0 if np.dot(parameters,s_tmp) < 0 else 1

                    env.observation_space = s_tmp
                    time.sleep( 1 )
                    env.env.render()

                    env.save_screenshot("hello.png")
                    exit()

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


def save_trajectory(env, parameters, outputFile = None):
    env.reset()
    done = False
    totalreward = 0

    traj = [ ['x','xDot','theta','thetaDot','action'] ]
    while not done:
        print (totalreward)
        print(parameters)
        observation = env.last_observation
        action = 0 if np.dot(parameters,observation) < 0 else 1

        future_obs = env.get_future_features(action)
        future_action = 0 if np.dot(parameters,future_obs) < 0 else 1

        reward, done = env.take_action(action, record=True)

        totalreward += reward
        if done:
            print ("Total reward " + str(totalreward))
            break

        if random.random() < 1:
            print ("saving action screenshot")
            env.save_action_screenshot(future_action=future_action)

        observation = env.last_observation

        #save the world state + action for later file output
        if outputFile != None :
            csvRow = list(observation)
            csvRow.append(action)
            traj.append(csvRow)

    #write run data to file
    if outputFile != None :
        ''' write as CSV
        with open(outputFile, 'w', newline='') as csvfile:
            spamwriter = csv.writer(csvfile, delimiter=',',
                                    quotechar='|', quoting=csv.QUOTE_MINIMAL)
            for step in traj :
                spamwriter.writerow(step)
        '''

        #very hacky way writing file data for an offline web-app
        #output data as a js variable in a .js file
        with open(outputFile, 'w') as outfile:
            outfile.write("window.run_data = ")
            json.dump(traj, outfile)

def show_policy_with_history_reel(env, parameters):
    env.reset()
    observation = env.last_observation
    totalreward = 0
    while True:
        # env.env.render()
        # time.sleep(0.01)

        action = 0 if np.dot(parameters, observation) < 0 else 1
        reward, done = env.take_action(action)
        totalreward += reward
        observation = env.last_observation
        if done:
            print (totalreward)
            break

if __name__ == "__main__":
    args = parser.parse_args()

    domain = CartPole()
    if args.parameters == None:
        trained_params = train(domain)
    else:
        trained_params = args.parameters

    print (trained_params)

    i = 0
    while True:
        print ("p to play, q to quit")
        show = input()
        if show == "q":
            domain.env.close()
            break

        # show_policy(domain, trained_params)
        outputFile = "./Screenshots/data%d.js" % (i)
        save_trajectory(domain, trained_params,outputFile)
        i+=1
        # domain.set_recording(recording=True)
        # visualize_policy(domain, trained_params)
