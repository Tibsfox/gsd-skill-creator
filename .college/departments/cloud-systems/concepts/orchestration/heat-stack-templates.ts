import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const heatStackTemplates: RosettaConcept = {
  id: 'cloud-heat-stack-templates',
  name: 'Heat Stack Templates',
  domain: 'cloud-systems',
  description:
    'Heat is the OpenStack orchestration service: it deploys and manages stacks of resources defined ' +
    'in HOT (Heat Orchestration Template) YAML files. ' +
    'Template structure: heat_template_version, description, parameters, resources, outputs. ' +
    'Parameters enable reusable templates: `parameters: { image_id: { type: string, default: cirros } }`. ' +
    'Resources define cloud infrastructure: OS::Nova::Server, OS::Neutron::Net, OS::Cinder::Volume. ' +
    'Resource dependencies are inferred from `get_resource` intrinsic functions -- Heat builds a ' +
    'dependency graph and creates resources in correct order. ' +
    'Stack operations: create, update (in-place modification), delete (all resources), preview (dry-run). ' +
    'Stack outputs export resource attributes: `outputs: { server_ip: { value: { get_attr: [server, first_address] } } }`. ' +
    'Nested stacks: a resource can reference another template, enabling modular composition. ' +
    'Stack validation: `heat template-validate -f template.yaml` catches syntax errors before deployment.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-nova-instances',
      description: 'Heat orchestrates Nova, Neutron, and Cinder resources together in a single deployment',
    },
    {
      type: 'dependency',
      targetId: 'cloud-multi-service-coordination',
      description: 'Heat manages cross-service resource dependencies and eventual consistency between Nova/Neutron/Cinder',
    },
  ],
  complexPlanePosition: {
    real: 0.60,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.60 ** 2 + 0.45 ** 2),
    angle: Math.atan2(0.45, 0.60),
  },
};
