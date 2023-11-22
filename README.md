<!--<style>
    .matrix-2048{
        border-collapse: collapse;
        
    }
    .matrix-2048 tr{
        width: 64px;
    }

    .matrix-2048 td{
        border: 2px solid grey;
        width: 36px;
        height: 36px;
        padding: 0;
        text-align: center;
        font-weight: bold;
    }

    h1, h2, h3, h4, h5 {
        border-bottom: 2px solid grey !important;
        width: 100%
    }
</style>!-->

# solve2048
Solving 2048 game with fixed algorithm

## 1. What is 2048

2048 is a game that allows players to move the block. The same block would merge when they touch each other and the value of the block will be doubled. Players win if they manage to obtain 2048 blocks, that might be why it is called 2048. If they cannot get 2048 blocks until the matrix is full of blocks, they would lose the game.

This game emphasises some special strategies for players, such as:
- DO NOT move the block out of the matrix
- SHOULD combine the blocks as much as possible
- SHOULD calculate some steps or some moves in advanced after each process.

## 2. How to play 2048

The player can simply use the arrow keys to move the entire matrix. The player can also use the 'w' key to move up, 'a' key to move left, 's' key to move down and 'd' key to move right. If the player enters a direction, the whole matrix will move in that direction. The same blocks that would touch each other in the direction given by the player will be merged and the value of the merged block will be doubled.

For example, if the matrix looks like this:

<table class="matrix-2048">
<tr><td>0</td><td>0</td><td>2</td><td>0</td></tr>
<tr><td>0</td><td>0</td><td>4</td><td>4</td></tr>
<tr><td>2</td><td>2</td><td>2</td><td>2</td></tr>
<tr><td>32</td><td>0</td><td>0</td><td>0</td></tr>
</table>

The player can then simply use the arrow keys to move the matrix to the left, for example:



<table class="matrix-2048">
<tr><td>2</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>8</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>4</td><td>4</td><td>0</td><td>0</td></tr>
<tr><td>32</td><td>0</td><td>0</td><td>0</td></tr>
</table>

In the above matrix
- ROW 1: Block 2 is moved to the left.
- ROW 2: two blocks 4 are merged into 8 and the block 8 is moved to the left.
- ROW 3: although moving to the left can be outside the matrix, the four blocks 2 can be made into two blocks 4. However, only two blocks can be merged into one at a time.
- ROW 4: Block 32 cannot be moved in this direction because it would be outside the matrix.

As expected, this matrix cannot be moved any further upwards as it would be out of the matrix and none of the blocks can be be merged anymore.

## How to solve 2048 by using algorithm?

### Method 1 - Calculating step-by-step

collecting the data of the current situation

#### Aspects

- We can consider these aspects to evaluate the current situation:

    - **(NSB) Number of squares at the boundary**
        
        Determine which direction is more feasible
    
    - **(NFR) Number of operationally feasible rows (columns) in the horizontal (vertical) direction**
        
        Determine which direction, whether it is feasible
    
    - **(NCD) Number of combinable squares of the same value in different directions**

        Evaluate which direction is better

The values taken can reflect the current situation, but weights are needed to improve the decision.

#### Weights <p style="float:right">(related to the old project - 2048.ts)</p>

The values collected for each aspect are of different importance. For example, aspect 2 above is much more important than any other aspect because the priority of the algorithm is to filter out the feasible directions.

The initial weighting is as follows:

| ASPECT NO. | INITIAL WEIGHT |
|:---:|:---:|
| NSB |(face the direction with the most boxes) <br> `this: 1`, `side: 2`, `opposite: 1` |
| NFR | `4` |
| NCD | `16` |

#### Process

Suppose the matrix of 2048 is as follows:

<table class="matrix-2048">
<tr><td>8</td><td>4</td><td>0</td><td>0</td></tr>
<tr><td>2</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>2</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
</table>

The process is as follows:
- 1. Collect the information
    - (NSB) Number of squares at the boundary

        The programme will count the number of blocks on each side, the result will be `[2, 3, 0, 0]`.
    
    - (NFR) Number of operationally feasible rows (columns) in the horizontal (vertical) direction

        The programme will count how many rows can be moved in each direction, the result will be `[1, 0, 2, 3]`.

        - **LEFT**: No blocks can be combined and no square can be moved.
        - **TOP**: Two 2 blocks can be combined, but there is no space to move further. So the value of col is `1`.
        - **RIGHT**: All blocks can be moved, as there are many null blocks.
        - **BOTTOM**: All blocks can be moved, as there are many zero blocks 

    - (NCD) Number of combinable squares of the same value in different directions

        This function would only return the value of the horizontal direction and the vertical direction.

        Two 2-blocks at (1, 2) and (1, 3) can be combined, but both UPWARD and DOWNWARD can achieve this goal, so **the value of the horizontal direction is the logarithm of the value of the combinable blocks (which are currently 2) with a base of 2**.     

        It returns the current value `[1, 0]`.

- 2. Select the direction

    The data collected in the first step is multiplied by the weights.

    The direction with the maximum final value is selected.

- 3. Move the matrix in this direction

#### Optimizing the weights

- The weight can be optimised by the process using the specially designed algorithm which generates the pairs of weights which are slightly different from the current weights. 

- Then the algorithm will test the decision making ability many times to get the most optimised weights in the generated pairs. The optimised weights will be put back to the algorithm for the next iteration to get further improvement.

- The whole process is like evolution in nature, so it can also be called "evolution of weights".

### Method 2 - Iterate through the entire selection tree

- The algorithm imagines what the matrix would look like for each possible decision. This creates a set of potential future matrices, which are expected to be the matrices after each decision has been made.

- It then evaluates each potential future matrix and assigns it a score based on how favourable it appears. The higher the score, the better the potential outcome.

- To make even smarter decisions, the function repeats this process for a few more steps into the future. It collects the outcome of each branch and the outcomes of branches of each branch to create a decision tree. The decision tree represents all the possible paths and outcomes that the game could take.

- By considering the scores assigned to the potential game boards at each step, the algorithm selects the direction that may lead to the most favourable outcome.

The program works as follows:

Suppose the matrix of 2048 is as follows, ignoring the random block factor:

<table class="matrix-2048">
<tr><td>8</td><td>4</td><td>0</td><td>0</td></tr>
<tr><td>2</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>2</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
</table>

- If it is moved UP, the matrix will look like this:

    <table class="matrix-2048">
    <tr><td>8</td><td>4</td><td>0</td><td>0</td></tr>
    <tr><td>4</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    </table>

- If it is moved DOWN, the matrix will look like this:

    <table class="matrix-2048">
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>8</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>4</td><td>4</td><td>0</td><td>0</td></tr>
    </table>

- If it is moved to the RIGHT, the matrix will look like this:

    <table class="matrix-2048">
    <tr><td>0</td><td>0</td><td>8</td><td>4</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>2</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>2</td></tr>
    <tr><td>0</td><td>0</td><td>0</td><td>0</td></tr>
    </table>

- The LEFT direction is ignored as the matrix cannot be moved in this direction.

The score of each branch is based on the score of the potential matrix divided by the depth, as the deduction ignores the randomly generated block.

The way to evaluate which direction to move is better. The only thing to consider is the score of the potential matrix.

Such extrapolations are repeated many times on each branch until they reach the limit of the given depth of the decision tree.

<img src="./doc/img/solver-multiple-decision-tree.svg" style="border-radius: 4px">

The largest sum of the branch and the sum of all the branches of the branch gives the direction it will execute.


---

LAST MODIFIED: 11/22, 2003
