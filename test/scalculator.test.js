const { ScalculatorUtils, INSTANCE_TYPES, RESOURCE_CONFIGS } = require('../script.js');

describe('Scalculator Tests', () => {
    
    describe('KEDA ScaledJob Calculations', () => {
        test('should calculate ScaledJob with parallelism greater than min replicas', () => {
            const config = {
                minReplicaCount: 2,
                maxReplicaCount: 10,
                parallelism: 5,
                requestedMemory: 256,
                requestedCpu: 100,
                maxMemory: 512
            };

            const result = ScalculatorUtils.calculateScaledJob(config);

            expect(result.minPods).toBe(10); // 2 * 5 = 10
            expect(result.maxPods).toBe(50); // 10 * 5 = 50
            expect(result.minMemoryMi).toBe(2560); // 10 * 256
            expect(result.maxMemoryMi).toBe(50 * 512); // 50 * 512
            expect(result.minCpuM).toBe(1000); // 10 * 100
            expect(result.maxCpuM).toBe(5000); // 50 * 100
        });

        test('should calculate ScaledJob with min replicas greater than parallelism', () => {
            const config = {
                minReplicaCount: 8,
                maxReplicaCount: 15,
                parallelism: 3,
                requestedMemory: 128,
                requestedCpu: 50,
                maxMemory: 256
            };

            const result = ScalculatorUtils.calculateScaledJob(config);

            expect(result.minPods).toBe(24); // 8 * 3 = 24
            expect(result.maxPods).toBe(45); // 15 * 3 = 45
            expect(result.minMemoryMi).toBe(24 * 128); // 24 * 128
            expect(result.maxMemoryMi).toBe(45 * 256); // 45 * 256
        });

        test('should handle ScaledJob with default values', () => {
            const config = {};
            const result = ScalculatorUtils.calculateScaledJob(config);

            expect(result.minPods).toBe(0); // 0 * 1
            expect(result.maxPods).toBe(0); // 0 * 1
            expect(result.minMemoryMi).toBe(0);
            expect(result.maxMemoryMi).toBe(0);
            expect(result.minCpuM).toBe(0);
            expect(result.maxCpuM).toBe(0);
        });
    });

    describe('KEDA ScaledObject Calculations', () => {
        test('should calculate ScaledObject correctly', () => {
            const config = {
                minReplicaCount: 2,
                maxReplicaCount: 20,
                requestedMemory: 512,
                requestedCpu: 200,
                maxMemory: 1024
            };

            const result = ScalculatorUtils.calculateScaledObject(config);

            expect(result.minPods).toBe(2);
            expect(result.maxPods).toBe(20);
            expect(result.minMemoryMi).toBe(1024); // 2 * 512
            expect(result.maxMemoryMi).toBe(20480); // 20 * 1024
            expect(result.minCpuM).toBe(400); // 2 * 200
            expect(result.maxCpuM).toBe(4000); // 20 * 200
        });

        test('should handle ScaledObject with zero replicas', () => {
            const config = {
                minReplicaCount: 0,
                maxReplicaCount: 0,
                requestedMemory: 256,
                requestedCpu: 100
            };

            const result = ScalculatorUtils.calculateScaledObject(config);

            expect(result.minPods).toBe(0);
            expect(result.maxPods).toBe(0);
            expect(result.minMemoryMi).toBe(0);
            expect(result.maxMemoryMi).toBe(0);
            expect(result.minCpuM).toBe(0);
            expect(result.maxCpuM).toBe(0);
        });
    });

    describe('Deployment Calculations', () => {
        test('should calculate Deployment with HPA enabled', () => {
            const config = {
                hasHPA: true,
                minReplicaCount: 3,
                maxReplicaCount: 12,
                requestedMemory: 256,
                requestedCpu: 150,
                maxMemory: 512
            };

            const result = ScalculatorUtils.calculateDeployment(config);

            expect(result.minPods).toBe(3);
            expect(result.maxPods).toBe(12);
            expect(result.minMemoryMi).toBe(768); // 3 * 256
            expect(result.maxMemoryMi).toBe(6144); // 12 * 512
            expect(result.minCpuM).toBe(450); // 3 * 150
            expect(result.maxCpuM).toBe(1800); // 12 * 150
        });

        test('should calculate Deployment without HPA', () => {
            const config = {
                hasHPA: false,
                replicas: 5,
                requestedMemory: 128,
                requestedCpu: 100,
                maxMemory: 256
            };

            const result = ScalculatorUtils.calculateDeployment(config);

            expect(result.minPods).toBe(5);
            expect(result.maxPods).toBe(5);
            expect(result.minMemoryMi).toBe(640); // 5 * 128
            expect(result.maxMemoryMi).toBe(1280); // 5 * 256
            expect(result.minCpuM).toBe(500); // 5 * 100
            expect(result.maxCpuM).toBe(500); // 5 * 100
        });

        test('should use requested memory as max memory when max memory is not provided', () => {
            const config = {
                hasHPA: false,
                replicas: 3,
                requestedMemory: 512,
                requestedCpu: 200
            };

            const result = ScalculatorUtils.calculateDeployment(config);

            expect(result.maxMemoryMi).toBe(1536); // 3 * 512 (requested memory used as max)
        });
    });

    describe('StatefulSet Calculations', () => {
        test('should calculate StatefulSet correctly', () => {
            const config = {
                replicas: 3,
                requestedMemory: 1024,
                requestedCpu: 500,
                maxMemory: 2048
            };

            const result = ScalculatorUtils.calculateStatefulSet(config);

            expect(result.minPods).toBe(3);
            expect(result.maxPods).toBe(3);
            expect(result.minMemoryMi).toBe(3072); // 3 * 1024
            expect(result.maxMemoryMi).toBe(6144); // 3 * 2048
            expect(result.minCpuM).toBe(1500); // 3 * 500
            expect(result.maxCpuM).toBe(1500); // 3 * 500
        });

        test('should handle StatefulSet with zero replicas', () => {
            const config = {
                replicas: 0,
                requestedMemory: 256,
                requestedCpu: 100
            };

            const result = ScalculatorUtils.calculateStatefulSet(config);

            expect(result.minPods).toBe(0);
            expect(result.maxPods).toBe(0);
            expect(result.minMemoryMi).toBe(0);
            expect(result.maxMemoryMi).toBe(0);
            expect(result.minCpuM).toBe(0);
            expect(result.maxCpuM).toBe(0);
        });
    });

    describe('Required Instances Calculations', () => {
        test('should calculate instances based on memory constraint', () => {
            const pods = 10;
            const memoryMi = 10240; // 10 GB
            const cpuM = 1000; // 1 core
            const instanceSpec = INSTANCE_TYPES['m5.xlarge']; // 4 cores, 16 GB

            const result = ScalculatorUtils.calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec);

            // Memory constraint: 10 GB / 16 GB = 1 instance
            // CPU constraint: 1 core / 4 cores = 1 instance
            // Pod constraint: 10 pods / 110 = 1 instance
            expect(result).toBe(1);
        });

        test('should calculate instances based on CPU constraint', () => {
            const pods = 5;
            const memoryMi = 2048; // 2 GB
            const cpuM = 6000; // 6 cores
            const instanceSpec = INSTANCE_TYPES['m5.xlarge']; // 4 cores, 16 GB

            const result = ScalculatorUtils.calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec);

            // Memory constraint: 2 GB / 16 GB = 1 instance
            // CPU constraint: 6 cores / 4 cores = 2 instances
            // Pod constraint: 5 pods / 110 = 1 instance
            expect(result).toBe(2);
        });

        test('should calculate instances based on pod constraint', () => {
            const pods = 220;
            const memoryMi = 1024; // 1 GB
            const cpuM = 500; // 0.5 cores
            const instanceSpec = INSTANCE_TYPES['m5.4xlarge']; // 16 cores, 64 GB

            const result = ScalculatorUtils.calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec);

            // Memory constraint: 1 GB / 64 GB = 1 instance
            // CPU constraint: 0.5 cores / 16 cores = 1 instance
            // Pod constraint: 220 pods / 110 = 2 instances
            expect(result).toBe(2);
        });

        test('should return 0 instances for zero pods', () => {
            const result = ScalculatorUtils.calculateRequiredInstances(0, 1024, 100, INSTANCE_TYPES['m5.xlarge']);
            expect(result).toBe(0);
        });

        test('should handle small instance types', () => {
            const pods = 5;
            const memoryMi = 3072; // 3 GB
            const cpuM = 1500; // 1.5 cores
            const instanceSpec = INSTANCE_TYPES['t3.micro']; // 1 core, 1 GB

            const result = ScalculatorUtils.calculateRequiredInstances(pods, memoryMi, cpuM, instanceSpec);

            // Memory constraint: 3 GB / 1 GB = 3 instances
            // CPU constraint: 1.5 cores / 1 core = 2 instances
            // Pod constraint: 5 pods / 110 = 1 instance
            expect(result).toBe(3);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle undefined or null values gracefully', () => {
            const config = {
                minReplicaCount: null,
                maxReplicaCount: undefined,
                requestedMemory: null,
                requestedCpu: undefined
            };

            const result = ScalculatorUtils.calculateScaledObject(config);

            expect(result.minPods).toBe(0);
            expect(result.maxPods).toBe(0);
            expect(result.minMemoryMi).toBe(0);
            expect(result.maxMemoryMi).toBe(0);
            expect(result.minCpuM).toBe(0);
            expect(result.maxCpuM).toBe(0);
        });

        test('should handle negative values by treating them as zero', () => {
            const config = {
                minReplicaCount: -1,
                maxReplicaCount: -5,
                requestedMemory: -256,
                requestedCpu: -100
            };

            const result = ScalculatorUtils.calculateScaledObject(config);

            expect(result.minPods).toBe(0);
            expect(result.maxPods).toBe(0);
            expect(result.minMemoryMi).toBe(0);
            expect(result.maxMemoryMi).toBe(0);
            expect(result.minCpuM).toBe(0);
            expect(result.maxCpuM).toBe(0);
        });

        test('should handle very large numbers', () => {
            const config = {
                replicas: 1000,
                requestedMemory: 1024,
                requestedCpu: 100,
                maxMemory: 2048
            };

            const result = ScalculatorUtils.calculateStatefulSet(config);

            expect(result.minPods).toBe(1000);
            expect(result.maxPods).toBe(1000);
            expect(result.minMemoryMi).toBe(1024000); // 1000 * 1024
            expect(result.maxMemoryMi).toBe(2048000); // 1000 * 2048
            expect(result.minCpuM).toBe(100000); // 1000 * 100
            expect(result.maxCpuM).toBe(100000); // 1000 * 100
        });
    });

    describe('Instance Type Configurations', () => {
        test('should have correct instance type specifications', () => {
            expect(INSTANCE_TYPES['t3.micro']).toEqual({ cpu: 1, memory: 1 });
            expect(INSTANCE_TYPES['m5.xlarge']).toEqual({ cpu: 4, memory: 16 });
            expect(INSTANCE_TYPES['c5.2xlarge']).toEqual({ cpu: 8, memory: 16 });
        });

        test('should include all expected instance types', () => {
            const expectedTypes = [
                't3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge',
                'm5.large', 'm5.xlarge', 'm5.2xlarge', 'm5.4xlarge',
                'c5.large', 'c5.xlarge', 'c5.2xlarge'
            ];

            // Check that all expected types exist
            const missingTypes = expectedTypes.filter(type => !(type in INSTANCE_TYPES));
            expect(missingTypes).toEqual([]);

            // Check that all types have the required properties
            expectedTypes.forEach(type => {
                const instance = INSTANCE_TYPES[type];
                expect(instance).toBeDefined();
                expect(instance.cpu).toBeDefined();
                expect(instance.memory).toBeDefined();
                expect(typeof instance.cpu).toBe('number');
                expect(typeof instance.memory).toBe('number');
            });
        });
    });

    describe('Resource Configuration Validation', () => {
        test('should have correct resource configurations', () => {
            expect(RESOURCE_CONFIGS).toHaveProperty('scaledJob');
            expect(RESOURCE_CONFIGS).toHaveProperty('scaledObject');
            expect(RESOURCE_CONFIGS).toHaveProperty('deployment');
            expect(RESOURCE_CONFIGS).toHaveProperty('statefulSet');
        });

        test('should have required fields for each resource type', () => {
            Object.values(RESOURCE_CONFIGS).forEach(config => {
                expect(config).toHaveProperty('name');
                expect(config).toHaveProperty('fields');
                expect(Array.isArray(config.fields)).toBe(true);
                expect(config.fields.length).toBeGreaterThan(0);
            });
        });

        test('should have valid field configurations', () => {
            Object.values(RESOURCE_CONFIGS).forEach(config => {
                config.fields.forEach(field => {
                    expect(field).toHaveProperty('id');
                    expect(field).toHaveProperty('label');
                    expect(field).toHaveProperty('type');
                    expect(typeof field.id).toBe('string');
                    expect(typeof field.label).toBe('string');
                    expect(typeof field.type).toBe('string');
                });
            });
        });
    });
}); 