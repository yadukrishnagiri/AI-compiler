# Game Developer's Guide to AI Code Iterator

This guide provides specific tips and examples for game developers using the AI Code Iterator tool to improve game-related code.

## Effective Prompts for Game Development

When using the AI Code Iterator, the quality of your prompts greatly affects the quality of suggestions. Here are some effective prompts specifically for game development:

### Performance Optimization

- "Optimize this game loop for better performance"
- "Refactor this collision detection code to handle more objects efficiently"
- "Improve the memory usage of this asset loading function"
- "Convert this rendering code to use batch processing for better performance"

### Code Architecture

- "Refactor this code to use an entity-component system"
- "Convert this procedural game logic to a state machine"
- "Implement the observer pattern for this event handling code"
- "Redesign this code to follow the Model-View-Controller pattern"

### Graphics and Physics

- "Add smooth interpolation to this camera movement code"
- "Implement proper vector math for this physics calculation"
- "Improve this lighting calculation for better visual effects"
- "Add screen space effects to this rendering pipeline"

### AI and Behavior

- "Enhance this enemy AI with pathfinding capabilities"
- "Improve this NPC behavior code to make decisions more realistically"
- "Implement a behavior tree for this character AI"
- "Add fuzzy logic to this decision-making system"

## Example Workflow

1. **Identify Code to Improve**: Select a function or class from your game that could benefit from improvement.

2. **Craft a Specific Prompt**: Instead of "Make this better," use specific requests like "Optimize this collision detection function for handling many objects."

3. **Evaluate Suggestions**: The AI will suggest modifications with explanations. Evaluate these based on:
   - Performance implications
   - Compatibility with your game engine
   - Maintainability and readability
   - Implementation complexity

4. **Integrate and Test**: Use the "Integrate Code" button to apply changes, then thoroughly test in your game environment.

## Sample Improvements

### Example 1: Optimizing Player Movement

**Original Code:**
```python
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
```

**Suggested Prompt:**
"Add support for diagonal movement and normalize the speed for consistent movement in all directions"

### Example 2: Improving Collision Detection

**Original Code:**
```python
def check_collision(obj1, obj2):
    if (obj1.x < obj2.x + obj2.width and
        obj1.x + obj1.width > obj2.x and
        obj1.y < obj2.y + obj2.height and
        obj1.y + obj1.height > obj2.y):
        return True
    return False
```

**Suggested Prompt:**
"Convert this AABB collision to use a spatial partitioning system for better performance with many objects"

## Engine-Specific Tips

### Unity

When working with Unity C# code, consider prompts like:
- "Convert this MonoBehaviour to use the new Unity Input System"
- "Optimize this rendering code to use Unity's Job System"
- "Refactor this code to follow Unity's recommended component architecture"

### Unreal Engine

For Unreal Engine C++ or Blueprint code, try:
- "Optimize this function to better utilize Unreal's actor component system"
- "Improve this code to use Unreal's delegate system instead of direct references"
- "Refactor this gameplay logic to use Unreal's replication system properly"

### Custom Engines

If you're using a custom engine:
- "Optimize this rendering loop for modern GPU architectures"
- "Implement multithreading in this physics system"
- "Refactor this code to better separate engine and game logic"

## Advanced Usage

For more complex game code improvements:

1. **Break Down Large Systems**: Instead of trying to improve an entire system at once, focus on specific functions or classes.

2. **Iterative Improvements**: Use the tool in multiple passes, focusing on one aspect at a time (e.g., first architecture, then performance).

3. **Combine with Manual Edits**: Use AI suggestions as a starting point, then manually refine the code based on your specific requirements.

4. **Learn from Explanations**: Pay attention to the explanations provided with each suggestion to understand the principles behind the improvements. 