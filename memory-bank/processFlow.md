flowchart LR

    %% --- PMO ---
    subgraph PMO
    A[Define Project Selection Criteria]
    B[Determine Weight Criteria <br>by using AHP]
    C[Create Rubric <br>for Project Criteria]
    D((Criteria Weight & Rubric))
    A --> B --> C --> D
    end
    
    %% --- Project Manager ---
    subgraph Project Manager
    E[Entry Basic Project Info]
    F[Self Assessment <br>Project Criteria]
    G((Project Info & <br>Self Assessment))
    E --> F --> G
    end

    %% --- Project Committee ---
    subgraph Project Committee
    H[Committee scoring]
    I[Portfolio Simulation & <br>Adjustment]
    J((Final Portfolio))
    H --> I --> J
    end

    %% --- Cross-lane connections ---
    D --> F
    D --> H
    G --> H
