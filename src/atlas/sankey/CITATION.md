# Citations: atlas/sankey

## Sankey Layout Algorithm (layout.ts)

Riehmann, P., Hanfler, M., & Froehlich, B. (2005).
Interactive Sankey diagrams.
*IEEE Symposium on Information Visualization (InfoVis 2005)*, 233–240.
https://doi.org/10.1109/INFVIS.2005.1532152

The column-assignment strategy (longest-path layering from topological sort)
and the barycentric relaxation for vertical position minimization (§3 of the
paper, "Positioning of Nodes") are implemented in `layout.ts`.
Sink nodes are forced to the rightmost column per §3.2.
