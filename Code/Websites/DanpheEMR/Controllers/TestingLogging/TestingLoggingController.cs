using DanpheEMR.Core.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Serilog;
using Serilog.Events;
using System;
using System.Collections.Generic;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace DanpheEMR.Controllers.TestingLogging
{
    public class TestingLoggingController : CommonController
    {
        public TestingLoggingController(IOptions<MyConfiguration> _config) : base(_config)
        {
        }

        // GET: api/<TestingLoggingController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            //throw new InvalidOperationException("This operation is not allowed!");
            Log.Error("Some error occured while fetching the information");

            return new string[] { "value1", "value2" };
        }

        // GET api/<TestingLoggingController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<TestingLoggingController>
        [HttpPost]
        public string Post([FromBody] TestingLogging testLoggingObject)
        {
            try
            {
                ValidateData(testLoggingObject);
                //Code to actually save the details in databse goes here where exceptions are expected, hence we need to wrap this logic inside try catch.
                Log.Information("Testing data set is saved successfully");
                return "Data saved successfully";
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private void ValidateData(TestingLogging testLoggingObject)
        {
            if (testLoggingObject == null || testLoggingObject.FirstName is null || testLoggingObject.LastName is null)
            {
                Log.Error($"Body cannot be null in the POST API, here {nameof(testLoggingObject)} is null!");
                throw new ArgumentNullException($"Body cannot be null in the POST API, here {nameof(testLoggingObject)} is null!");
            }
        }

        // PUT api/<TestingLoggingController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
            throw new InvalidOperationException("This is unhandled Exception");
        }

        // DELETE api/<TestingLoggingController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }

    public class TestingLogging
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
