import React from 'react';
import { Card, Col, Row } from 'antd';

const Dashboard = () => {
    return (
        <Row gutter={16}>
            <Col span={8}>
                <Card title="Total Pipelines" bordered={false}>
                    15
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Active Workflows" bordered={false}>
                    5
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Failed Jobs" bordered={false}>
                    2
                </Card>
            </Col>
        </Row>
    );
};

export default Dashboard;
