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

    def add_button(self, canvas, x, good_button, bad_button, button_id):
        bad_robot_button = tk.Button(self.GUI, image=bad_button, command=lambda: self.callback(button_id, "bad"))
        bad_robot_button.configure(background="white")
        bad_robot_button.place(x=x + 150 - 40, y=170)
        good_robot_button = tk.Button(self.GUI, image=good_button, command=lambda: self.callback(button_id, "good"))
        good_robot_button.configure(background="white")
        good_robot_button.place(x=x + 150, y=170)


    def add_image(self, canvas, file, x):
        img = tk.PhotoImage(file=file)
        img = img.zoom(2) #with 250, I ended up running out of memory
        img = img.subsample(5) #mechanically, here it is adjusted to 32 in
        canvas.create_image(x + img.width()/2, 75, image=img)
        self.img_array.append(img)


    def run(self):
        self.GUI = tk.Tk()
        self.GUI.title("Teach the Robot")
        canvas = tk.Canvas(self.GUI, width=WIDTH, height=HEIGHT, background="white")
        canvas.pack()

        bad_button_image = Image.open(BAD_BUTTON_NAME, 'r')
        bad_button_image = bad_button_image.resize((25,25), Image.ANTIALIAS)
        img_bad_robot_btn = ImageTk.PhotoImage(bad_button_image)

        good_button_image = Image.open(GOOD_BUTTON_FILENAME, 'r')
        good_button_image = good_button_image.resize((25,25), Image.ANTIALIAS)
        img_good_robot_btn = ImageTk.PhotoImage(good_button_image)


        self.add_button(canvas, x=20, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id = 1)
        self.add_button(canvas, x=20+290, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id = 2)
        self.add_button(canvas, x=20+290*2, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=3)
        self.add_button(canvas, x=20+290*3, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=4)
        self.add_button(canvas, x=20+290*4, good_button=img_good_robot_btn, bad_button=img_bad_robot_btn, button_id=5)


        count = 1
        while 1:

            img1 = tk.PhotoImage(file="Screenshots/tmp/" + str(count + 5) + ".png")
            canvas.create_image(WIDTH/2, HEIGHT-int(img1.height()/2), image=img1)

            self.GUI.update()
            time.sleep(0.1)
            count += 1

    def __init__(self):
        self.run()

if __name__ == "__main__":
    interface = Interface()
