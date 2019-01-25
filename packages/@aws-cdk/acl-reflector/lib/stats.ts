import reflect = require('jsii-reflect');
import { Module, Resource } from './report';

export interface Statistics {
  modules: {
    total: number;
    framework: number;
    aws: number;
    layer2: number;
  },

  types: {
    total: number;
    generated: number;
    handwritten: number;
  },

  resources: {
    total: number;
    layer2: number;
  }
}

export function gatherStatistics(ts: reflect.TypeSystem, modules: Module[]): Statistics {
  const aws = ts.assemblies.filter(m => m.name.startsWith('@aws-cdk/aws-'));
  const types = [ ...ts.classes, ...ts.enums, ...ts.interfaces ].filter(removeLegacy);
  const generated = types.filter(t => isGenerated(t));
  const l2 = aws.filter(m => hasLayerTwo(m));
  const resources = new Array<Resource>();
  modules.forEach(m => resources.push(...m.resources));

  return {
    modules: {
      total: ts.assemblies.length,
      aws: aws.length,
      framework: ts.assemblies.length - aws.length,
      layer2: l2.length,
    },

    types: {
      total: types.length,
      generated: generated.length,
      handwritten: types.length - generated.length,
    },

    resources: {
      total: resources.length,
      layer2: resources.filter(r => r.layer2).length
    }
  };
}

function removeLegacy(type: reflect.ClassType | reflect.InterfaceType | reflect.EnumType) {
  const name = type.fqn.substr(type.assembly.name.length + 1);
  return !name.startsWith('cloudformation.');

}

function isGenerated(type: reflect.ClassType | reflect.InterfaceType | reflect.EnumType) {
  const name = type.fqn.substr(type.assembly.name.length + 1);
  const gen = name.startsWith('Cfn');
  if (!gen) {
    console.error(name);
  }
  return gen;
}

function hasLayerTwo(module: reflect.Assembly): boolean {
  const ret = module.classes.filter(removeLegacy).filter(c => !isGenerated(c)).length > 0;
  if (ret) {
    console.error(module.name);
    for (const cls of module.classes.filter(x => !isGenerated(x))) {
      console.error('  ', cls.name);
    }
  }
  return ret;
}