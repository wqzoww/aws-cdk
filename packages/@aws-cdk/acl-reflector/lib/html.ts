import reflect = require('jsii-reflect');
import { Report } from './report';

// tslint:disable:max-line-length

export function writeHtml(ts: reflect.TypeSystem, report: Report, out: NodeJS.WriteStream = process.stdout) {
  let indent = 0;

  const e = (open: string, block?: (() => void) | string) => {
    out.write(' '.repeat(indent * 2));
    out.write(`<${open}>\n`);
    const close = open.split(' ')[0];
    indent++;
    if (typeof block === 'string') {
      out.write(' '.repeat(indent * 2));
      out.write(block);
      out.write('\n');
    } else if (typeof block === 'function') {
      block();
    }
    indent--;
    out.write(' '.repeat(indent * 2));
    out.write(`</${close}>\n`);
  };

  e('html', () => {
    e('head', () => {
      e('style', `
      table {
        border-collapse: collapse;
      }

      h2 {
        margin: 0px;
        margin-top: 10px;
      }

      tr {
        border-bottom: 1px silver solid;
      }

      th {
        text-align: left;
        background-color: #eee;
      }
      `);
    });

    e('body', () => {

      e('h1', 'Statistics');
      e('li', 'Modules');
      e('ul', () => {
        e('li', `Total: ${report.stats.modules.total}`);
        e('li', `Framework: ${report.stats.modules.framework}`);
        e('li', `AWS: ${report.stats.modules.aws}`);
      });
      e('li', 'Types');
      e('ul', () => {
        e('li', `Total: ${report.stats.types.total}`);
        e('li', `Generated: ${report.stats.types.generated}`);
        e('li', `Hand-written: ${report.stats.types.handwritten}`);
      });
      e('li', 'L2 Coverage');
      e('ul', () => {
        e('li', `Modules: %${Math.floor(report.stats.modules.layer2 / report.stats.modules.aws * 100)}`);
        e('li', `Resources: %${Math.floor(report.stats.resources.layer2 / report.stats.resources.total * 100)}`);
      });

      e('h1', 'AWS Construct Library');

      e('table width="100%"', () => {

        for (const module of report.modules) {
            if (module.resources.length === 0) {
              continue;
            }

            e('tr', () => e('td colspan=6', () => e('h2', module.namespace)));

            e('tr', () => {
              e('th', 'layer1 construct');
              e('th', 'layer2 construct');
              e('th', 'ref type');
              e('th', 'grants');
              e('th', 'metrics');
              e('th', 'events');
            });

            for (const resource of module.resources) {
              e('tr', () => {
                const layer1 = ts.findFqn(resource.layer1);
                e('td', () => doclink(layer1.fqn, layer1.name));

                if (resource.layer2) {
                  const layer2 = ts.findFqn(resource.layer2);
                  e('td', () => doclink(layer2.fqn, layer2.name));
                  if (resource.ref) {
                    const refType = ts.findFqn(resource.ref);
                    e('td', () => doclink(refType.fqn, refType.name));
                  } else {
                    e('td');
                  }
                  e('td', () => docmethods(layer2.fqn, resource.grants));
                  e('td', () => docmethods(layer2.fqn, resource.metrics));
                  e('td', () => docmethods(layer2.fqn, resource.events));
                } else {
                  e('td');
                  e('td');
                  e('td');
                  e('td');
                  e('td');
                }
              });
            }
          }
        });
    });
  });

  function docmethods(type: string, methods: string[] = []) {
    methods.forEach(method => {
      e('li', () => doclink(`${type}.${method}`, method));
    });
  }

  function doclink(fqn: string, text: string) {
    let [ module, ] = fqn.split('.');
    module = module.replace(/[@\/]/g, '_');
    const link = `https://awslabs.github.io/aws-cdk/refs/${module}.html#${fqn}`;
    e(`a href='${link}'`, text);
  }
}