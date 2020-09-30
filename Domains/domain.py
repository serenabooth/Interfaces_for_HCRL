import abc

class Domain(abc.ABC):
    @abc.abstractmethod
    def get_state_vec(self):
        pass

    @abc.abstractmethod
    def get_current_features(self):
        pass

    @abc.abstractmethod
    def get_future_features(self, state, action):
        pass

    @abc.abstractmethod
    def get_possible_actions(self, constraint=None):
        pass

    @abc.abstractmethod
    def take_action(self, action):
        pass
