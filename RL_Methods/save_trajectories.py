import sys
import numpy as np
import csv
sys.path.append("../Domains")
from cartpole import CartPole

policies = {
    "Undulating" : np.array([-0.28795545, 0.4220686, -0.55905958, 0.79609386]),
    "Rigid"      : np.array([-0.06410089, 0.18941857, 0.43170927, 0.30863926]),
}

def update_state(state, action):
    """
    Use OpenAI Gym implementation to predict how the state will change.

    Params
    ------
        state : list of form [x, xdot, theta, thetadot]
        action : int [0 or 1, corresponding to left or right]

    Returns
    -------
        obs : a list of form [x, xdot, theta, thetadot]
    """
    cartpole = CartPole()
    cartpole.set_state(state)
    _, done = cartpole.take_action(action)

    # if the last action takes it out of range, REPEAT
    # This could use more attention to make sure behavior is desirable...
    if done:
        print ("Warning: action took state out of bounds")
        cartpole.set_state(state)

    return cartpole.last_observation

def select_action(policy_weights, state):
    return 0 if np.dot(policy_weights, state) < 0 else 1

def record_random_trajectory(policy_weights, starting_state = None):
    """
    Params
    ------
        policy_weights: np.array of length 4
        starting_state: np.array of length 4
    """
    state_history = []
    cartpole = CartPole()
    if starting_state != None:
        cartpole.set_state(starting_state)

    state = cartpole.get_current_features()

    done = False
    while not done:
        state_history.append(state)
        action = select_action(policy_weights, state)
        _, done = cartpole.take_action(action)
        # cartpole.env.render()
        state = cartpole.get_current_features()
    # cartpole.env.close()
    return state_history

# policy_choice = "Rigid"
# policy_weights = policies[policy_choice]
for i in range(0,10):
    policy_weights = np.random.rand(4)
    state = [0,0,0,0]
    state_history = record_random_trajectory(policy_weights, starting_state=state)
    with open("../saved_trajectories/random_policies_same_start" + str(i) + ".csv", 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                                    quotechar='|', quoting=csv.QUOTE_MINIMAL)
        for state in state_history:
            writer.writerow(state)
