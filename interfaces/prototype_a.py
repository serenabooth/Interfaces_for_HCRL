import tkinter as tk
import time
from PIL import ImageTk, Image

HEIGHT = 720
WIDTH = 1440
GOOD_BUTTON_FILENAME = 'Assets/checkmark.png'
BAD_BUTTON_NAME = 'Assets/cross.png'

class Interface():

    GUI = None
    img_array = []

    def callback(self, id, feedback):
        print (id)
        print (feedback)

    def add_image(self, canvas, file, x, good_button, bad_button, button_id):
        img = tk.PhotoImage(file=file)
        img = img.zoom(2) #with 250, I ended up running out of memory
        img = img.subsample(5) #mechanically, here it is adjusted to 32 in
        canvas.create_image(x + img.width()/2, 75, image=img)

        bad_robot_button = tk.Button(self.GUI, image=bad_button, command=lambda: self.callback(button_id, "bad"))
        bad_robot_button.configure(background="white")
        bad_robot_button.place(x=x + img.width()/2 - 40, y=170)
        good_robot_button = tk.Button(self.GUI, image=good_button, command=lambda: self.callback(button_id, "good"))
        good_robot_button.configure(background="white")
        good_robot_button.place(x=x + img.width()/2, y=170)

        self.img_array.append(img)

    def run(self):
        self.GUI = tk.Tk()
        x = 0
        self.GUI.title("Teach the Robot")

        canvas = tk.Canvas(self.GUI, width=WIDTH, height=HEIGHT, background="white")
        canvas.pack()
        img1 = tk.PhotoImage(file="Screenshots/tmp/2.png")
        canvas.create_image(WIDTH/2, HEIGHT-int(img1.height()/2), image=img1)


        bad_button_image = Image.open(BAD_BUTTON_NAME, 'r')
        bad_button_image = bad_button_image.resize((25,25), Image.ANTIALIAS)
        img_bad_robot_btn = ImageTk.PhotoImage(bad_button_image)

        good_button_image = Image.open(GOOD_BUTTON_FILENAME, 'r')
        good_button_image = good_button_image.resize((25,25), Image.ANTIALIAS)
        img_good_robot_btn = ImageTk.PhotoImage(good_button_image)

        self.add_image(canvas, file="Screenshots/tmp/out_41.png", x=20, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id = 1)
        self.add_image(canvas, file="Screenshots/tmp/out_43.png", x=20+290, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id = 2)
        self.add_image(canvas, file="Screenshots/tmp/out_44.png", x=20+290*2, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=3)
        self.add_image(canvas, file="Screenshots/tmp/out_49.png", x=20+290*3, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=4)
        self.add_image(canvas, file="Screenshots/tmp/out_53.png", x=20+290*4, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=5)

        # img3 = tk.PhotoImage(file="Screenshots/tmp/out_6.png")
        # img3 = img3.zoom(2) #with 250, I ended up running out of memory
        # img3 = img3.subsample(5) #mechanically, here it is adjusted to 32 in
        # canvas.create_image(300 + img3.width()/2, 75, image=img3)
        # bad_robot_button = tk.Button(self.GUI, image=img_bad_robot_btn, command=lambda: self.callback(2, "bad"))
        # bad_robot_button.configure(background="white")
        # bad_robot_button.place(x=300 + img3.width()/2 - 40, y=170)
        # good_robot_button = tk.Button(self.GUI, image=img_good_robot_btn, command=lambda: self.callback(2, "good"))
        # good_robot_button.configure(background="white")
        # good_robot_button.place(x=300 + img3.width()/2, y=170)


        while 1:
            self.GUI.update()
            time.sleep(0.01)

    def __init__(self):
        self.run()

if __name__ == "__main__":
    interface = Interface()
