# source: https://github.com/thehawkgriffith/CartPole-A2C/

import torch
import torch.nn as nn
import numpy as np
import gym
import matplotlib.pyplot as plt
import time, random
from copy import deepcopy

C = 0.01
POSSIBLE_ACTIONS = []
DEVICE = None

class PolicyNet(nn.Module):

    def __init__(self, input_shape, n_actions):
        super(PolicyNet, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(4, 128),
            nn.ReLU(),
            nn.Linear(128, n_actions),
            nn.Softmax()
        )

    def forward(self, x):
        x = x.view(1, -1)
        return self.fc(x)


class Baseline(nn.Module):

    def __init__(self, input_shape):
        super(Baseline, self).__init__()
        shape = 1
        for dim in input_shape:
            shape *= dim
        self.fc = nn.Sequential(
            nn.Linear(shape, 512),
            nn.ReLU(),
            nn.Linear(512, 1)
        )

    def forward(self, x):
        x = x.view(1, -1)
        return self.fc(x)


class Agent:

    def __init__(self, policy_net, baseline_net):
        self.policy_net = policy_net
        self.baseline = baseline_net

    def train(self, env, num_traj, iterations, gamma, base_epochs):
        iter_rewards = []
        for iter in range(iterations):
            trajectories = []
            ITER_REW = 0
            for _ in range(num_traj):
                rewards = []
                log_probs = []
                states = []
                s = env.reset()
                done = False
                while not done:
                    s = torch.FloatTensor([s]).to(DEVICE)
                   
                    a = self.policy_net(s)
                    states.append(s)
                    del s
                    a2 = a.detach().cpu().numpy()
                    vec = [0, 1]
                    u = np.random.choice(vec, 1, replace=False, p=a2[0])
                    log_probs.append(a[0][u])
                    del a
                    sp, r, done, _ = env.step(u[0])
                    if done:
                        if len(rewards) < 50:
                            r = -200
                    ITER_REW += r
                    rewards.append(r)
                    # env.render()
                    s = sp
                trajectories.append({'log_probs': log_probs, 'rewards': rewards, 'states': states})
            # self.update_baseline(base_epochs, trajectories, gamma)
            self.update_parameters(trajectories, gamma)
            print("ITERATION:", iter + 1, "AVG REWARD:", ITER_REW / num_traj)
            iter_rewards.append(ITER_REW/num_traj)
        return iter_rewards

    def update_parameters(self, trajectories, gamma):
        c = 0.01
        loss = torch.tensor([0]).float().to(DEVICE)

        optim = torch.optim.Adam(list(self.policy_net.parameters()) + list(self.baseline.parameters()), lr=0.05)
        for trajectory in trajectories:
            for t in range(len(trajectory['rewards'])):
                r_t = torch.tensor([0]).float().to(DEVICE)
                log_prob = trajectory['log_probs'][t]
                temp = trajectory['rewards'][t:t + 20]
                for i, reward in enumerate(temp[:-1]):
                    r_t += gamma ** i * reward
                critic_estimate = self.baseline(trajectory['states'][t])[0]
                r_t += gamma ** i * self.baseline(trajectory['states'][i+1])[0]
                advantage_t = r_t - critic_estimate
                loss += (-log_prob * advantage_t) + (c * (critic_estimate - r_t) ** 2)
                if t % 20 == 0:
                    optim.zero_grad()
                    loss.backward()
                    optim.step()
                    loss = torch.tensor([0]).float().to(DEVICE)

    def play(self, env, num_games):
        for game in range(num_games):
            print ('Are you ready for a new game?')
            new_game = input()

            done = False
            s = env.reset()
            reward = 0
            while not done:
                s = torch.FloatTensor([s]).to(DEVICE)
                a = self.policy_net(s).detach().cpu().numpy()
                del s
                # u = np.random.choice(POSSIBLE_ACTIONS, size=1, replace=False, p=a[0])
                # u_idx = np.argmax(a[0])
                # u = POSSIBLE_ACTIONS[u_idx]
                u = np.random.choice(POSSIBLE_ACTIONS, size=1, replace=False, p=a[0])[0]

                s, r, done, _ = env.step(u)
                reward += r
                if done:
                    print ("Total reward: " + str(reward))
                    break
                env.render()
                time.sleep(0.01)
        env.close()

    def visualize_policy(self, env):
        s = env.reset()

        action_1 = []
        action_2 = []

        for i in range(0, 20):
            print ("Original " + str(s))
            s_tmp = deepcopy(s)
            s_tmp[2] = random.gauss(s_tmp[2], 0.05)
            print ("New " + str(s_tmp))
            s_tmp = torch.FloatTensor([s_tmp]).to(DEVICE)
            a = self.policy_net(s_tmp).detach().cpu().numpy()
            # u_idx = np.argmax(a[0])
            # u = POSSIBLE_ACTIONS[u_idx]
            u = np.random.choice(POSSIBLE_ACTIONS, size=1, replace=False, p=a[0])[0]

            if u == 0:
                action_1.append(s_tmp)
            elif u == 1:
                action_2.append(s_tmp)
            else:
                print (u)

        print (action_1)
        print (action_2)

def main():
    global POSSIBLE_ACTIONS, DEVICE
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    env = gym.make('CartPole-v0')
    POSSIBLE_ACTIONS = range(env.action_space.n)
    policy_net = PolicyNet(env.observation_space.shape, env.action_space.n).to(DEVICE)
    base_net = Baseline(env.observation_space.shape).to(DEVICE)
    agent = Agent(policy_net, base_net)
    reward_history = agent.train(env, num_traj=32, iterations=50, gamma=0.99, base_epochs=5)
    # plt.plot(reward_history)
    # plt.show()
    agent.play(env, 10)
    agent.visualize_policy(env)

main()
