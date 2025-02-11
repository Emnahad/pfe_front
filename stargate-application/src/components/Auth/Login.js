import React from 'react';
import { Button, Form, Input } from 'antd';
import axios from 'axios';

const Login = () => {
    const onFinish = async (values) => {
        try {
            const response = await axios.post('/api/auth/login', values);
            console.log('Login Successful:', response.data);
        } catch (error) {
            console.error('Login Failed:', error);
        }
    };

    return (
        <Form onFinish={onFinish}>
            <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                <Input placeholder="Username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                <Input.Password placeholder="Password" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
                Login
            </Button>
        </Form>
    );
};

export default Login;
