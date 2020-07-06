import TAMER
import COACH
from cartpole import CartPole
import numpy as np
import matplotlib.pyplot as plt

def test_cartpole_TAMER(oracle_parameters):
    # Run environment
    domain = CartPole()

    total_rewards = []
    for _ in range(0,1):
        episode_total_rewards, eval_episodes = TAMER.tamer_with_credit_assignment(domain, num_episodes=16, oracle_parameters = oracle_parameters)
        if total_rewards == []:
            total_rewards = episode_total_rewards

        for j in range(0, len(eval_episodes)):
            total_rewards[j] = total_rewards[j] + episode_total_rewards[j]

    print (total_rewards)

    mean_rewards = np.mean(total_rewards, axis = 1)
    rewards_std = np.std(total_rewards, axis=1)

    return eval_episodes, mean_rewards, rewards_std



def test_cartpole_COACH(oracle_parameters):
    domain = CartPole()

    total_rewards = []
    for _ in range(0,1):
        episode_total_rewards, eval_episodes = COACH.COACH_CARTPOLE(domain, num_episodes=15, trace_set = [0], reward_fn = 0, learning_rate = 0.1, oracle_parameters = oracle_parameters)
        if total_rewards == []:
            total_rewards = episode_total_rewards

        for j in range(0, len(eval_episodes)):
            total_rewards[j] = total_rewards[j] + episode_total_rewards[j]

    print (total_rewards)

    mean_rewards = np.mean(total_rewards, axis = 1)
    rewards_std = np.std(total_rewards, axis=1)

    return eval_episodes, mean_rewards, rewards_std



if __name__ == "__main__":

    oracle_parameters =  [-0.06410089, 0.18941857, 0.43170927, 0.30863926]

    # tamer_eval_episodes, tamer_mean_rewards, tamer_rewards_std = test_cartpole_TAMER(oracle_parameters)
    # plt.plot(tamer_eval_episodes, tamer_mean_rewards, label="tamer")
    # plt.fill_between(tamer_eval_episodes, tamer_mean_rewards - tamer_rewards_std,
    #                             tamer_mean_rewards + tamer_rewards_std, alpha=0.2)

    coach_eval_episodes, coach_mean_rewards, coach_rewards_std = test_cartpole_COACH(oracle_parameters = oracle_parameters)
    plt.plot(coach_eval_episodes, coach_mean_rewards, label="coach")
    plt.fill_between(coach_eval_episodes, coach_mean_rewards - coach_rewards_std,
                                coach_mean_rewards + coach_rewards_std, alpha=0.2)

    plt.legend()
    plt.ylim((0,500))
    plt.show()
