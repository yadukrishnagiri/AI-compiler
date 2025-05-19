from player import Player

# Create a player
hero = Player("Hero")
print(f"Created player: {hero.name}")
print(f"Initial position: {hero.position}")
print(f"Initial health: {hero.health}")
print(f"Is alive: {hero.is_alive}")

# Move the player around
print("\nMoving around:")
hero.move("up")
print(f"After moving up: {hero.position}")

hero.move("right")
print(f"After moving right: {hero.position}")

hero.move("down")
print(f"After moving down: {hero.position}")

hero.move("left")
print(f"After moving left: {hero.position}")

# Try an invalid direction
hero.move("diagonal")

# Test taking damage
print("\nTaking damage:")
hero.take_damage(30)
print(f"Health after damage: {hero.health}")
print(f"Is alive: {hero.is_alive}")

# Take fatal damage
hero.take_damage(80)
print(f"Health after fatal damage: {hero.health}")
print(f"Is alive: {hero.is_alive}")

print("\nPlayer class is working correctly!") 