import React from 'react';
import { Form, Input, Button } from 'antd';

const ConfigForm = () => {
    const onFinish = (values) => {
        console.log('Form Values:', values);
    };

    return (
        <Form onFinish={onFinish} layout="vertical">
            <Form.Item label="Pipeline Name" name="pipelineName" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item label="Source" name="source" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item label="Destination" name="destination" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">
                Save
            </Button>
        </Form>
    );
};

export default ConfigForm;
