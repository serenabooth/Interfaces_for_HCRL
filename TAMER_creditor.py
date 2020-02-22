from scipy import integrate, stats

HUMAN_RESPONSE_TIME_MINIMUM = 0.2

class Creditor:
    historyWindow = []
    lastFeatureVec = None # list of binary values
    windowSize = None # in seconds
    lastTime = None # int 0, 1, 2, ...
    timeStepSize = None # in seconds
    creditHistoryLen = None

    def __init__(self, windowSize, creditHistoryLen = 5, timeStepSize = 0.2):
        self.windowSize = windowSize # 0.2
        self.creditHistoryLen = creditHistoryLen
        self.timeStepSize = timeStepSize # 0.2

    def assignCredit(self, time):
        # ASSUME: UNIFORM DISTRIBUTION
        def uniform_distribution_function(x):
            start = self.lastTime * self.timeStepSize - self.windowSize + HUMAN_RESPONSE_TIME_MINIMUM
            start = max(HUMAN_RESPONSE_TIME_MINIMUM, start)
            # end = start + self.windowSize
            value = stats.uniform.pdf(x, loc=start, scale=self.windowSize)
            return value

        x1 = time * self.timeStepSize
        x2 = x1 + self.timeStepSize
        res, err = integrate.quad(uniform_distribution_function, x1, x2)
        return res

    def getHistoryWindow(self):
        return self.historyWindow[-self.creditHistoryLen:]

    def updateWindow(self, f, time):
        self.lastFeatureVec = f
        self.lastTime = time
        self.historyWindow.append((f, time))
