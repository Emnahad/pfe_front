import React, { useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";

const EditableNode = ({ id, data, onLabelChange, onDelete }) => {
    const [value, setValue] = useState(data.label);

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        if (value.trim() === "") {
            setValue(data.label); // Prevent empty labels
        } else {
            onLabelChange?.(id, value); // Call only if function exists
        }
    };

    return (
        <div
            style={{
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                background: "#fff",
                minWidth: 150,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
            }}
        >
            {/* Target handle for incoming edges */}
            <Handle type="target" position={Position.Left} style={{ background: "#555" }} />

            <input
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                    background: "transparent",
                }}
            />

            <button
                onClick={() => onDelete?.(id)} // Call only if function exists
                style={{
                    marginTop: 8,
                    background: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "5px 10px",
                    cursor: "pointer",
                }}
            >
                Delete
            </button>

            {/* Source handle for outgoing edges */}
            <Handle type="source" position={Position.Right} style={{ background: "#555" }} />
        </div>
    );
};

// Prop validation (Optional, but good practice)
EditableNode.propTypes = {
    id: PropTypes.string.isRequired,
    data: PropTypes.shape({
        label: PropTypes.string.isRequired,
    }).isRequired,
    onLabelChange: PropTypes.func,
    onDelete: PropTypes.func,
};

export default EditableNode;
