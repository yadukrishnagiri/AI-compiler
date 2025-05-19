# Example 1: Basic Player Movement
def update_player_position(player, direction, speed):
    if direction == "up":
        player.y -= speed
    elif direction == "down":
        player.y += speed
    elif direction == "left":
        player.x -= speed
    elif direction == "right":
        player.x += speed
    
    # Make sure player stays within bounds
    if player.x < 0:
        player.x = 0
    if player.x > 800:
        player.x = 800
    if player.y < 0:
        player.y = 0
    if player.y > 600:
        player.y = 600

# Example 2: Basic Collision Detection
def check_collision(obj1, obj2):
    if (obj1.x < obj2.x + obj2.width and
        obj1.x + obj1.width > obj2.x and
        obj1.y < obj2.y + obj2.height and
        obj1.y + obj1.height > obj2.y):
        return True
    return False

# Example 3: Simple Game Loop
def game_loop():
    running = True
    while running:
        # Process events
        for event in get_events():
            if event.type == QUIT:
                running = False
        
        # Update game state
        update_player()
        update_enemies()
        check_collisions()
        
        # Render
        clear_screen()
        draw_player()
        draw_enemies()
        draw_ui()
        
        # Cap the frame rate
        wait(1/60)  # Target 60 FPS

# Example 4: Loading Game Assets
def load_game_assets():
    assets = {}
    
    # Load images
    assets["player"] = load_image("player.png")
    assets["enemy"] = load_image("enemy.png")
    assets["background"] = load_image("background.png")
    
    # Load sounds
    assets["jump"] = load_sound("jump.wav")
    assets["explosion"] = load_sound("explosion.wav")
    
    return assets

# Example 5: Basic Enemy AI
def update_enemy(enemy, player):
    # Calculate direction to player
    dx = player.x - enemy.x
    dy = player.y - enemy.y
    
    # Move towards player
    if abs(dx) > abs(dy):
        if dx > 0:
            enemy.x += enemy.speed
        else:
            enemy.x -= enemy.speed
    else:
        if dy > 0:
            enemy.y += enemy.speed
        else:
            enemy.y -= enemy.speed