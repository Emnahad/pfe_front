import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import EditableNode from "./EditableNode"; // Import your custom node
import { createWorkflow, fetchWorkflows, deleteWorkflow, updateWorkflow } from "../../services/api";
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import { throttle } from 'lodash'; // Import throttle for resize handling

// Icons for Undo, Redo, and Save
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import SaveIcon from "@mui/icons-material/Save";

// Initial nodes and edges setup
const initialNodes = [
    {
        id: "1",
        type: "editableNode",
        data: { label: "Input Node" },
        position: { x: 250, y: 0 },
        sourcePosition: "right",
        targetPosition: "left",
    },
    {
        id: "2",
        type: "editableNode",
        data: { label: "Editable Node", onLabelChange: () => { } },
        position: { x: 100, y: 100 },
        sourcePosition: "right",
        targetPosition: "left",
    },
    {
        id: "3",
        type: "editableNode",
        data: { label: "Output Node" },
        position: { x: 400, y: 100 },
        sourcePosition: "right",
        targetPosition: "left",
    },
];

const initialEdges = [
   /* { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#4A90E2", strokeWidth: 3 } },
    { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#4A90E2", strokeWidth: 3 } }*/
];

const Workflow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [workflows, setWorkflows] = useState([]); // State to store workflows
    const [selectedWorkflow, setSelectedWorkflow] = useState(null); // State to track selected workflow
    const [editingWorkflowId, setEditingWorkflowId] = useState(null);
    const [editedWorkflowName, setEditedWorkflowName] = useState("");
   
    const handleEditClick = (workflow) => {
        setEditingWorkflowId(workflow.id);
        setEditedWorkflowName(workflow.name);
    };

    const handleBlurOrEnter = (workflowId) => {
        if (editedWorkflowName.trim() !== "") {
            handleUpdateWorkflow(workflowId, editedWorkflowName);
        }
        setEditingWorkflowId(null);
    };
    const handleUpdateWorkflow = async (workflowId, newName) => {
        try {
            const updatedWorkflow = await updateWorkflow(workflowId, { name: newName });
            setWorkflows(workflows.map(wf => wf.id === workflowId ? { ...wf, name: newName } : wf));
            setEditingWorkflowId(null);
        } catch (error) {
            console.error("Error updating workflow name:", error);
        }
    };

    // Fetch workflows on component mount
    useEffect(() => {
        
        const loadWorkflows = async () => {
            const fetchedWorkflows = await fetchWorkflows();
            setWorkflows(fetchedWorkflows);
        };
        loadWorkflows();
    }, []);

    // History stacks for undo and redo
    const [history, setHistory] = useState({
        undo: [],
        redo: [],
    });

    // Handle workflow selection
    const handleWorkflowSelect = (workflow) => {
        setSelectedWorkflow(workflow);
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
    };

    // Handle workflow deletion
    const handleDeleteWorkflow = async (id) => {
        const success = await deleteWorkflow(id);
        if (success) {
            setWorkflows(workflows.filter((workflow) => workflow.id !== id));
            if (selectedWorkflow?.id === id) {
                setSelectedWorkflow(null);
                setNodes(initialNodes);
                setEdges(initialEdges);
            }
        }
    };
    const createNewWorkflow = async () => {
        const workflowData = {
            name: `Workflow ${workflows.length + 1}`,
            nodes: [],  // Empty nodes
            edges: []   // Empty edges
        };

        try {
            const newWorkflow = await createWorkflow(workflowData);
            if (newWorkflow) {
                setWorkflows([...workflows, newWorkflow]);
                setSelectedWorkflow(newWorkflow);
                setNodes([]);
                setEdges([]);
            }
        } catch (error) {
            console.error("Error creating workflow:", error);
        }
    };


    const saveWorkflow = async () => {
        if (!selectedWorkflow) {
            console.error("No workflow selected to save.");
            return;
        }

        // Find the existing workflow by ID
        const existingWorkflowIndex = workflows.findIndex(wf => wf.id === selectedWorkflow.id);

        if (existingWorkflowIndex === -1) {
            console.error("Workflow not found, preventing duplicate entry.");
            return;
        }

        // Prepare updated workflow data
        const updatedWorkflow = {
            ...selectedWorkflow,
            nodes: nodes.map(node => ({
                id: node.id,
                type: node.type,
                data: node.data,
                position: node.position,
                sourcePosition: node.sourcePosition,
                targetPosition: node.targetPosition,
                width: node.width,
                height: node.height
            })),
            edges: edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                animated: edge.animated,
                style: edge.style
            }))
        };

        console.log("Updating workflow:", updatedWorkflow);

        try {
            // Call API with PUT instead of POST
            const savedWorkflow = await updateWorkflow(selectedWorkflow.id, updatedWorkflow);

            if (savedWorkflow) {
                // Update workflows list without creating duplicates
                const updatedWorkflows = [...workflows];
                updatedWorkflows[existingWorkflowIndex] = savedWorkflow;
                setWorkflows(updatedWorkflows);
                setSelectedWorkflow(savedWorkflow);
                console.log("Workflow updated successfully.");
            }
        } catch (error) {
            console.error("Error updating workflow:", error);
        }
    };

    



    // Handle label changes
    const onLabelChange = (id, newLabel) => {
        const updatedNodes = nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, label: newLabel } } : node
        );
        setNodes(updatedNodes);
        saveState(updatedNodes, edges);
    };

    // Handle node connections
    const onConnect = useCallback(
        (params) => {
            const newEdges = addEdge(params, edges);
            setEdges(newEdges);
            saveState(nodes, newEdges);
        },
        [nodes, edges, setEdges]
    );

    // Handle node drops
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const reactFlowBounds = event.target.getBoundingClientRect();
            const type = event.dataTransfer.getData("application/reactflow");

            if (!type) return;

            const x = event.clientX - reactFlowBounds.left;
            const y = event.clientY - reactFlowBounds.top;

            // Ensure node stays within bounds
            if (x < 0 || y < 0 || x > reactFlowBounds.width || y > reactFlowBounds.height) return;

            const newNode = {
                id: uuidv4(), // Use uuidv4 to generate a unique ID
                type,
                position: { x, y },
                data: {
                    label: `${type} Node`,
                    onLabelChange: onLabelChange, // Pass the onLabelChange function here
                },
            };

            setNodes((prevNodes) => [...prevNodes, newNode]);
            saveState([...nodes, newNode], edges);
        },
        [nodes, edges, setNodes, onLabelChange] // Add onLabelChange to the dependency array
    );

    // Handle drag over
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);
    
    // Handle node deletion
    const onDelete = (id) => {
        setNodes((prevNodes) => {
            const updatedNodes = prevNodes.filter((node) => node.id !== id);
            console.log("Updated Nodes:", updatedNodes);
            return updatedNodes;
        });

        setEdges((prevEdges) => {
            const updatedEdges = prevEdges.filter(
                (edge) => edge.source !== id && edge.target !== id
            );
            console.log("Updated Edges:", updatedEdges);
            return updatedEdges;
        });
    };

    // Save state for undo/redo
    const saveState = (newNodes, newEdges) => {
        setHistory((prevHistory) => ({
            undo: [...prevHistory.undo, { nodes: newNodes, edges: newEdges }],
            redo: [],
        }));
    };

    // Undo functionality
    const undo = () => {
        if (history.undo.length === 0) return;
        const lastState = history.undo[history.undo.length - 1];
        setNodes(lastState.nodes);
        setEdges(lastState.edges);
        setHistory((prevHistory) => ({
            undo: prevHistory.undo.slice(0, -1),
            redo: [{ nodes: lastState.nodes, edges: lastState.edges }, ...prevHistory.redo],
        }));
    };

    // Redo functionality
    const redo = () => {
        if (history.redo.length === 0) return;
        const nextState = history.redo[0];
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
        setHistory((prevHistory) => ({
            undo: [...prevHistory.undo, { nodes: nextState.nodes, edges: nextState.edges }],
            redo: prevHistory.redo.slice(1),
        }));
    };

    // Memoize nodeTypes to avoid unnecessary re-creations
    const nodeTypes = useMemo(() => ({
        editableNode: (props) => <EditableNode {...props} onDelete={onDelete} />, // Pass onDelete to EditableNode
    }), []);

    // Memoized ReactFlow component to prevent unnecessary re-renders
    const MemoizedReactFlow = useMemo(() => React.memo(ReactFlow), []);

    // Throttle resize events to prevent ResizeObserver errors
    useEffect(() => {
        const throttledResize = throttle(() => {
            // Handle resize logic here if needed
        }, 100);

        window.addEventListener('resize', throttledResize);
        return () => window.removeEventListener('resize', throttledResize);
    }, []);

    // Ignore ResizeObserver errors if they occur
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            if (/ResizeObserver loop completed with undelivered notifications/.test(args[0])) {
                return;
            }
            originalError(...args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    return (
        <ReactFlowProvider snapToGrid={true}
            snapGrid={[10, 10]}>
            <div style={{ display: "flex", height: "100vh" }}>
                {/* Workflow List Sidebar */}
                <aside style={{ width: 250, padding: 20, background: "#f0f4f8", borderRight: "1px solid #ddd" }}>
                    <h2 style={{ marginBottom: 20, color: "#4A90E2" }}>Workflows</h2>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {workflows.map((workflow) => (
                            <li
                                key={workflow.id}
                                style={{
                                    padding: 10,
                                    marginBottom: 10,
                                    background: selectedWorkflow?.id === workflow.id ? "#4A90E2" : "#fff",
                                    color: selectedWorkflow?.id === workflow.id ? "#fff" : "#333",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                }}
                                onClick={() => handleWorkflowSelect(workflow)}
                            >
                                <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
                                    {editingWorkflowId === workflow.id ? (
                                        <input
                                            type="text"
                                            value={editedWorkflowName}
                                            onChange={(e) => setEditedWorkflowName(e.target.value)}
                                            onBlur={() => handleBlurOrEnter(workflow.id)}
                                            onKeyDown={(e) => e.key === "Enter" && handleBlurOrEnter(workflow.id)}
                                            autoFocus
                                            style={{ flexGrow: 1, marginRight: "10px", color: "black" }}
                                        />
                                    ) : (
                                        <span onClick={() => handleEditClick(workflow)} style={{ flexGrow: 1 }}>
                                            {workflow.name}
                                        </span>
                                    )}

                                    {/* Fixed Delete Button */}
                                    <button
                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                        style={{
                                            position: "absolute",
                                            right: "10px", // Keep it fixed on the right
                                            cursor: "pointer",
                                            background: "transparent",
                                            border: "none",
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>

                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={createNewWorkflow}
                        style={{
                            width: "100%",
                            padding: "10px",
                            background: "#4A90E2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            marginTop: 20,
                        }}
                    >
                        + Create New Workflow
                    </button>
                </aside>

                {/* Node Drag Sidebar */}
                <aside style={{ width: 200, padding: 20, background: "#f0f4f8", borderRight: "1px solid #ddd" }}>
                    <div
                        onDragStart={(event) => event.dataTransfer.setData("application/reactflow", "editableNode")}
                        draggable
                        style={{
                            padding: 15,
                            marginBottom: 20,
                            background: "#4A90E2",
                            color: "#fff",
                            textAlign: "center",
                            cursor: "grab",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.2s ease-in-out",
                        }}
                    >
                        Editable Node
                    </div>
                    <div
                        onDragStart={(event) => event.dataTransfer.setData("application/reactflow", "editableNode")}
                        draggable
                        style={{
                            padding: 15,
                            marginBottom: 20,
                            background: "#4A90E2",
                            color: "#fff",
                            textAlign: "center",
                            cursor: "grab",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.2s ease-in-out",
                        }}
                    >
                        Input Node
                    </div>
                    <div
                        onDragStart={(event) => event.dataTransfer.setData("application/reactflow", "editableNode")}
                        draggable
                        style={{
                            padding: 15,
                            marginBottom: 20,
                            background: "#4A90E2",
                            color: "#fff",
                            textAlign: "center",
                            cursor: "grab",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.2s ease-in-out",
                        }}
                    >
                        Output Node
                    </div>
                </aside>

                {/* ReactFlow Canvas */}
                <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
                    <MemoizedReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        nodeTypes={nodeTypes}
                    >
                        <MiniMap />
                        <Controls />
                        <Background />
                    </MemoizedReactFlow>
                </div>
            </div>

            {/* Floating Control Bar with Undo/Redo and Save Buttons */}
            <div
                style={{
                    position: "absolute",
                    top: "420px",
                    left: "20px",
                    zIndex: 10,
                    backgroundColor: "#4A90E2",
                    borderRadius: "8px",
                    padding: "15px 3px",
                    display: "flex",
                    width: "220px",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                }}
            >
                <button
                    onClick={undo}
                    disabled={history.undo.length === 0}
                    style={{
                        background: "#fff",
                        border: "none",
                        padding: "10px",
                        cursor: "pointer",
                        color: "#4A90E2",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#e0e0e0")}
                    onMouseLeave={(e) => (e.target.style.background = "#fff")}
                >
                    <UndoIcon fontSize="small" />
                </button>
                <button
                    onClick={redo}
                    disabled={history.redo.length === 0}
                    style={{
                        background: "#fff",
                        border: "none",
                        padding: "10px",
                        cursor: "pointer",
                        color: "#4A90E2",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#e0e0e0")}
                    onMouseLeave={(e) => (e.target.style.background = "#fff")}
                >
                    <RedoIcon fontSize="small" />
                </button>
                <button
                    onClick={saveWorkflow}
                    style={{
                        background: "#fff",
                        border: "none",
                        padding: "10px",
                        cursor: "pointer",
                        color: "#4A90E2",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#e0e0e0")}
                    onMouseLeave={(e) => (e.target.style.background = "#fff")}
                >
                    <SaveIcon fontSize="small" />
                </button>
            </div>
        </ReactFlowProvider>
    );
};

export default Workflow;