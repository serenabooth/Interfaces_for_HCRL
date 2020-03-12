# Interfaces_for_HCRL

## Manual Control
If you would like to manually control the cart, run:
`python3 Domains/cartpole.py`

## Oracle
We can create oracles by implementing a linear policy,
and searching for parameters which score well.
This is implemented in `Domains/cartpole_oracle.py`

## Creating GIFs
If you would like to create a GIF, run:
`python3 Domains/cartpole_oracle.py`

This will save videos of the runs you play to a `vid/` directory.
To turn these videos into GIFs, use software of your choice

To record videos elsewhere, use the function `set_recording(...)` in `Domains\cartpole.py`

## Reinforcement Learning
The directory `RL_Methods` has some RL implementations,
including TAMER (a human-centered RL approach).
These are WIP.
