import cxapi = require('@aws-cdk/cx-api');
import { Test } from 'nodeunit';
import { App, AvailabilityZoneProvider, Construct, ContextProvider,
  MetadataEntry, resolve, SSMParameterProvider, Stack } from '../lib';

export = {
  'AvailabilityZoneProvider returns a list with dummy values if the context is not available'(test: Test) {
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    Construct.tree.push(stack);
    const azs = new AvailabilityZoneProvider().availabilityZones;
    Construct.tree.pop(stack);

    test.deepEqual(azs, ['dummy1a', 'dummy1b', 'dummy1c']);
    test.done();
  },

  'AvailabilityZoneProvider will return context list if available'(test: Test) {
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    Construct.tree.push(stack);
    
    const before = new AvailabilityZoneProvider().availabilityZones;
    test.deepEqual(before, [ 'dummy1a', 'dummy1b', 'dummy1c' ]);
    const key = expectedContextKey(stack);

    stack.setContext(key, ['us-east-1a', 'us-east-1b']);

    const azs = new AvailabilityZoneProvider().availabilityZones;
    test.deepEqual(azs, ['us-east-1a', 'us-east-1b']);

    Construct.tree.pop(stack);

    test.done();
  },

  'AvailabilityZoneProvider will complain if not given a list'(test: Test) {
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    Construct.tree.push(stack);

    const before = new AvailabilityZoneProvider().availabilityZones;
    test.deepEqual(before, [ 'dummy1a', 'dummy1b', 'dummy1c' ]);
    const key = expectedContextKey(stack);

    stack.setContext(key, 'not-a-list');

    test.throws(
      () => new AvailabilityZoneProvider().availabilityZones
    );
    
    Construct.tree.pop(stack);

    test.done();
  },

  'ContextProvider consistently generates a key'(test: Test) {
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    
    Construct.tree.push(stack);
    
    const provider = new ContextProvider('ssm', {
      parameterName: 'foo',
      anyStringParam: 'bar',
    });
    const key = provider.key;
    test.deepEqual(key, 'ssm:account=12345:anyStringParam=bar:parameterName=foo:region=us-east-1');
    const complex = new ContextProvider('vpc', {
      cidrBlock: '192.168.0.16',
      tags: { Name: 'MyVPC', Env: 'Preprod' },
      igw: false,
    });
    const complexKey = complex.key;
    test.deepEqual(complexKey,
      'vpc:account=12345:cidrBlock=192.168.0.16:igw=false:region=us-east-1:tags.Env=Preprod:tags.Name=MyVPC');
      
    Construct.tree.pop(stack);
    
    test.done();
  },

  'Key generation can contain arbitrarily deep structures'(test: Test) {
    // GIVEN
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    
    Construct.tree.push(stack);

    // WHEN
    const provider = new ContextProvider('provider', {
      list: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ],
    });
    
    Construct.tree.pop(stack);

    // THEN
    test.equals(provider.key, 'provider:account=12345:list.0.key=key1:list.0.value=value1:list.1.key=key2:list.1.value=value2:region=us-east-1');

    test.done();
  },

  'SSM parameter provider will return context values if available'(test: Test) {
    const stack = new Stack('TestStack', { env: { account: '12345', region: 'us-east-1' } });
    
    Construct.tree.push(stack);
    
    new SSMParameterProvider({parameterName: 'test'}).parameterValue();
    const key = expectedContextKey(stack);

    stack.setContext(key, 'abc');

    const ssmp = new SSMParameterProvider({parameterName: 'test'});
    const azs = resolve(ssmp.parameterValue());
    test.deepEqual(azs, 'abc');

    Construct.tree.pop(stack);

    test.done();
  },

  'Return default values if "env" is undefined to facilitate unit tests, but also expect metadata to include "error" messages'(test: Test) {
    const app = new App();
    const stack = new Stack('test-stack');
    
    Construct.tree.push(stack);

    const child = new Construct('ChildConstruct');

    test.deepEqual(new AvailabilityZoneProvider().availabilityZones, [ 'dummy1a', 'dummy1b', 'dummy1c' ]);
    
    Construct.tree.push(child);
    test.deepEqual(new SSMParameterProvider({parameterName: 'foo'}).parameterValue(), 'dummy');
    Construct.tree.pop(child);

    const output = app.synthesizeStack(stack.id);

    const azError: MetadataEntry | undefined = output.metadata['/test-stack'].find(x => x.type === cxapi.ERROR_METADATA_KEY);
    const ssmError: MetadataEntry | undefined = output.metadata['/test-stack/ChildConstruct'].find(x => x.type === cxapi.ERROR_METADATA_KEY);

    test.ok(azError && (azError.data as string).includes('Cannot determine scope for context provider availability-zones'));
    test.ok(ssmError && (ssmError.data as string).includes('Cannot determine scope for context provider ssm'));

    Construct.tree.pop(stack);

    test.done();
  },
};

function firstKey(obj: any): string {
  return Object.keys(obj)[0];
}

/**
 * Get the expected context key from a stack with missing parameters
 */
function expectedContextKey(stack: Stack): string {
  return firstKey(stack.missingContext);
}
