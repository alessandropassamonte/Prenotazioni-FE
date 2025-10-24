import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.widgets import TextBox, Button
import csv, os

class Annotatore:
    def __init__(self, file_img, out_csv, start_id=1):
        self.img_path = file_img
        self.out_csv = out_csv
        self.start_id = start_id
        self.img = mpimg.imread(file_img)

        self.points = []          # (id, x, y)
        self.drawn = []           # [(pt_marker, text)]
        self.last_click = None    # (x, y)
        self.next_id = start_id

        self.fig, self.ax = plt.subplots()
        self.fig.canvas.manager.set_window_title(f"Annota: {os.path.basename(file_img)}")
        self.ax.imshow(self.img)
        self.ax.set_title("1) Clicca il centro scrivania  2) Imposta ID  3) Aggiungi  |  Salva CSV per esportare")
        self.ax.axis('on')

        # UI area
        box_h = 0.05
        self.ax_box  = self.fig.add_axes([0.13, 0.93, 0.2, box_h])
        self.ax_add  = self.fig.add_axes([0.35, 0.93, 0.12, box_h])
        self.ax_undo = self.fig.add_axes([0.48, 0.93, 0.12, box_h])
        self.ax_save = self.fig.add_axes([0.61, 0.93, 0.15, box_h])

        self.id_box = TextBox(self.ax_box, "ID:", initial=str(self.next_id))
        self.btn_add  = Button(self.ax_add, "Aggiungi")
        self.btn_undo = Button(self.ax_undo, "Undo")
        self.btn_save = Button(self.ax_save, "Salva CSV")

        # bindings
        self.cid_click = self.fig.canvas.mpl_connect('button_press_event', self.on_click)
        self.btn_add.on_clicked(self.on_add)
        self.btn_undo.on_clicked(self.on_undo)
        self.btn_save.on_clicked(self.on_save)

        plt.show()

    def on_click(self, event):
        if event.inaxes != self.ax or event.xdata is None:
            return
        self.last_click = (float(event.xdata), float(event.ydata))
        # marker provvisorio
        self._clear_temp()
        m = self.ax.plot([self.last_click[0]], [self.last_click[1]], marker='x', markersize=8)[0]
        t = self.ax.text(self.last_click[0]+5, self.last_click[1]-5, "?", fontsize=7, color="black")
        self.temp = (m, t)
        self.fig.canvas.draw_idle()

    def on_add(self, _):
        if self.last_click is None:
            print("Nessun punto cliccato.")
            return
        sid = self.id_box.text.strip()
        if not sid:
            print("ID vuoto.")
            return
        if any(sid == p[0] for p in self.points):
            print(f"ID duplicato: {sid}")
            return
        x, y = self.last_click
        self.points.append((sid, x, y))
        # disegna definitivo
        m = self.ax.plot([x], [y], marker='o', markersize=4)[0]
        t = self.ax.text(x+5, y+5, sid, fontsize=7)
        self.drawn.append((m, t))
        self._clear_temp()
        self.last_click = None
        # autoincremento
        try:
            self.next_id = int(sid) + 1
            self.id_box.set_val(str(self.next_id))
        except ValueError:
            pass
        self.fig.canvas.draw_idle()

    def on_undo(self, _):
        if not self.points:
            return
        self.points.pop()
        m, t = self.drawn.pop()
        m.remove(); t.remove()
        self.fig.canvas.draw_idle()

    def on_save(self, _):
        if not self.points:
            print("Nessun punto da salvare.")
            return
        with open(self.out_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "x_px", "y_px"])
            w.writerows(self.points)
        print(f"Salvato: {os.path.abspath(self.out_csv)}")

    def _clear_temp(self):
        if hasattr(self, "temp") and self.temp:
            for a in self.temp:
                a.remove()
            self.temp = None

def annota(file_img, out_csv, start_id=1):
    Annotatore(file_img, out_csv, start_id)

# Esempi d'uso:
annota("piano_1.jpg", "p1_points.csv", start_id=1)
annota("piano_3.jpg", "p3_points.csv", start_id=1)
