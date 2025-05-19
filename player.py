class Player:
    def __init__(self, name):
        self.name = name
        self.health = 100
        self.position = [0, 0]
        self.is_alive = True
        
    def move(self, direction):
        if direction.lower() == "up":
            self.position[1] += 1
        elif direction.lower() == "down":
            self.position[1] -= 1
        elif direction.lower() == "left":
            self.position[0] -= 1
        elif direction.lower() == "right":
            self.position[0] += 1
        else:
            print("Invalid direction")
            
    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.is_alive = False
            print(f"{self.name} has been defeated!")
        else:
            print(f"{self.name} has {self.health} health remaining.") 